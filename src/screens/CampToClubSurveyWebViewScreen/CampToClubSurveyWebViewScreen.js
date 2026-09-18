import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import SecondaryHeader from '@components/Layout/SecondaryHeader';
import Config from 'react-native-config';
import { getDataFromStorage } from '../../utils/JsHelper/Helper';

// Same origin as the profile/plp WebViews, so values are quoted as JS string literals
// the same way (see ProfileWebViewScreen). U+2028/U+2029 are legal in JSON but were
// illegal in JS string literals before ES2019.
const jsString = (value) =>
  JSON.stringify(String(value ?? ''))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

// The web app's own header (MUI AppBar, class MuiAppBar-root) and site-wide footer
// (a <footer> element) render on every route including /plp-surveys — there's no
// query param or flag the web app checks to suppress them for an embedded WebView, so
// they're hidden here on the native side instead of touching the web app.
//
// The AppBar itself is safe to display:none (it's statically positioned, so its space
// collapses), but the Box that wraps it has its own fixed minHeight (64px, sized to
// the AppBar) which survives the AppBar being hidden and leaves a blank gap. Hiding
// that wrapper (and its own ancestors, in case more than one level reserves height)
// still doesn't fully close the gap in practice, so on top of that this also scrolls
// the survey title into view right under the native Android header — that way the
// title is what the user sees first regardless of whatever residual gap is left above
// it, instead of chasing every possible source of reserved space on the web side.
//
// The survey list's own in-content back arrow (BackHeader's ArrowBackIcon) has
// nothing to go back to inside the WebView, so it's hidden only on the list page
// (/plp-surveys) and shown again once a specific survey is opened (/survey-fill/...).
//
// This is a Next.js SPA, and the survey list itself is a lazily-loaded MFE
// (`import('@survey-forms/app/survey-list/SurveyListPage')`), so on a cold first load
// the AppBar/BackHeader DOM doesn't exist yet at the moment this script runs — a fixed
// setTimeout raced that load and missed it, which is why the title was visible behind
// the app header only on first load, not on returning from a survey (by then the MFE
// chunk is already cached). A MutationObserver replaces the fixed delays: it keeps
// re-applying as the DOM changes, however long the MFE takes to render, and is also
// what picks the script back up on every in-app route change without a full reload.
const HIDE_WEB_CHROME_SCRIPT = `
  (function() {
    var LIST_PATH = '/plp-surveys';

    function ensureChromeHiddenStyle() {
      if (!document.getElementById('rn-hide-web-chrome')) {
        var style = document.createElement('style');
        style.id = 'rn-hide-web-chrome';
        style.innerHTML = 'header.MuiAppBar-root { display: none !important; } footer { display: none !important; }';
        (document.head || document.documentElement).appendChild(style);
      }
    }

    // Walk up from the AppBar hiding every ancestor box that still reserves height,
    // not just its immediate parent (stops short of the shared root box, which also
    // holds the actual page content as a sibling).
    function hideAppBarAncestors() {
      var appBar = document.querySelector('header.MuiAppBar-root');
      var ancestor = appBar ? appBar.parentElement : null;
      var hops = 0;
      while (ancestor && hops < 3) {
        ancestor.style.setProperty('display', 'none', 'important');
        ancestor.style.setProperty('min-height', '0', 'important');
        ancestor.style.setProperty('height', '0', 'important');
        ancestor = ancestor.parentElement;
        hops += 1;
      }
    }

    function findTitleRow() {
      var backIcon = document.querySelector('svg[data-testid="ArrowBackIcon"]');
      var backButton = backIcon ? backIcon.closest('button') : null;
      return backButton ? { backButton: backButton, titleRow: backButton.parentElement } : null;
    }

    function updateBackArrow(backButton) {
      if (window.location.pathname === LIST_PATH) {
        backButton.style.setProperty('display', 'none', 'important');
      } else {
        backButton.style.removeProperty('display');
      }
    }

    // Scroll to the title at most once per page view — otherwise every DOM mutation
    // on the same page (e.g. survey list items loading in) would keep yanking the
    // user's scroll position back to the top.
    var scrolledForPath = null;
    function applyAll() {
      ensureChromeHiddenStyle();
      hideAppBarAncestors();

      var found = findTitleRow();
      if (!found) {
        return;
      }
      updateBackArrow(found.backButton);

      if (scrolledForPath !== window.location.pathname && found.titleRow) {
        found.titleRow.scrollIntoView({ block: 'start' });
        scrolledForPath = window.location.pathname;
      }
    }

    applyAll();

    // One observer persists for the lifetime of the WebView; re-injecting this
    // script on every load/navigation must not create a second one.
    if (!window.__rnSurveyChromeObserver) {
      window.__rnSurveyChromeObserver = new MutationObserver(applyAll);
      window.__rnSurveyChromeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  })();
  true;
`;

const buildInjectedJavaScript = (entries) => {
  const statements = Object.entries(entries).map(([key, value]) =>
    value === null || value === undefined || value === ''
      ? `window.localStorage.removeItem(${jsString(key)});`
      : `window.localStorage.setItem(${jsString(key)}, ${jsString(value)});`
  );

  return `
    (function() {
      try {
        ${statements.join('\n        ')}
        console.log('[BeforeLoad] Camp to Club survey WebView localStorage seeded');
      } catch (error) {
        console.error('[BeforeLoad] Error seeding survey WebView:', error);
      }
    })();
    ${HIDE_WEB_CHROME_SCRIPT}
  `;
};

const CampToClubSurveyWebViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [injectedJavaScript, setInjectedJavaScript] = useState(null);
  const webViewRef = useRef(null);

  // Points straight at the learner-web-app survey list, bypassing its own nav menu
  // (and that menu's separate isVolunteer gate) since this tab is the entry point.
  const url = `${Config.LEARNER_PLP_LINK}/plp-surveys`;

  // The survey web app reads everything it needs from localStorage, so every key has
  // to be seeded before the page loads. Values come from AsyncStorage, hence the
  // WebView is not rendered until the injection script is built.
  useEffect(() => {
    const buildInjection = async () => {
      try {
        const tenantData = JSON.parse(
          (await getDataFromStorage('tenantData')) || 'null'
        );
        const preferredLanguage = await getDataFromStorage('preferred_language');
        const tenantId =
          tenantData?.[0]?.tenantId ||
          (await getDataFromStorage('userTenantid')) ||
          '';
        const profileDetails = JSON.parse(
          (await getDataFromStorage('profileData')) || 'null'
        )?.getUserDetails?.[0];
        // Geo fields live only inside the customFields blob, keyed by label
        // (matches the equivalent extraction in Youthnet/SurveyForm.js).
        const customFields = (profileDetails?.customFields || []).reduce(
          (acc, { label, selectedValues }) => {
            acc[label] = Array.isArray(selectedValues)
              ? selectedValues.map((item) => item?.id).join(', ')
              : selectedValues;
            return acc;
          },
          {}
        );

        setInjectedJavaScript(
          buildInjectedJavaScript({
            isAndroidApp: 'yes',
            token: await getDataFromStorage('Accesstoken'),
            // The web app reads refreshTokenForAndroid first and writes the rotated
            // value back to it after a 401 refresh.
            refreshTokenForAndroid: await getDataFromStorage('refreshToken'),
            userId: await getDataFromStorage('userId'),
            tenantId,
            userProgram: tenantData?.[0]?.tenantName || '',
            academicYearId: await getDataFromStorage('academicYearId'),
            preferred_language: preferredLanguage,
            lang: preferredLanguage,
            // This tab only ever shows the learner-facing survey list.
            surveyCategory: '["learner"]',
            mfe_state: customFields?.STATE,
            mfe_district: customFields?.DISTRICT,
            mfe_block: customFields?.BLOCK,
            mfe_villageId: customFields?.VILLAGE,
          })
        );
      } catch (error) {
        console.error('Error building survey WebView injection:', error);
      }
    };

    buildInjection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <SecondaryHeader logo />
      <View style={styles.webviewContainer}>
        {(loading || !injectedJavaScript) && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        {injectedJavaScript && (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            originWhitelist={['*']}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
            // The credential-seeding part of injectedJavaScriptBeforeContentLoaded is
            // deliberately not re-run after load (see ProfileWebViewScreen), but the
            // chrome/back-arrow script carries no credentials, so it's safe to
            // re-apply on load and on every in-app navigation below (same pattern as
            // PlpWebViewScreen) — needed because this is a Next.js SPA, so moving
            // between the survey list and a survey's fill page is a client-side route
            // change, not a fresh page load.
            injectedJavaScript={HIDE_WEB_CHROME_SCRIPT}
            onLoad={() => {
              setLoading(false);
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(HIDE_WEB_CHROME_SCRIPT);
              }
            }}
            onNavigationStateChange={() => {
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(HIDE_WEB_CHROME_SCRIPT);
              }
            }}
            style={styles.webview}
            startInLoadingState={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  webviewContainer: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default CampToClubSurveyWebViewScreen;
