import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  StatusBar,
  I18nManager,
  Dimensions,
} from 'react-native';
import SafeAreaWrapper from '../../../components/SafeAreaWrapper/SafeAreaWrapper';
import { PermissionsAndroid } from 'react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import {
  readContent,
  hierarchyContent,
  assessmentTracking,
  listQuestion,
  telemetryTracking,
  contentTracking,
  questionsetRead,
  resumeTrackingStatus,
} from '../../../utils/API/ApiCalls';
import {
  qumlPlayerConfig,
  contentPlayerConfig,
  pdfPlayerConfig,
  videoPlayerConfig,
  epubPlayerConfig,
  questionsData,
} from './data';
import { getData, removeData, storeData } from '../../../utils/Helper/JSHelper';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import Config from 'react-native-config';

import Orientation from 'react-native-orientation-locker';
import {
  findObjectByIdentifier,
  getDataFromStorage,
  getUserId,
  logEventFunction,
  setDataInStorage,
} from '../../../utils/JsHelper/Helper';
import {
  getSyncTrackingOfflineCourse,
  storeAsessmentOffline,
  storeTelemetryOffline,
  storeTrackingOffline,
} from '../../../utils/API/AuthService';
import TestResultModal from '../../Assessment/TestResultModal';
import MimeAlertModal from '../../../components/MimeAletModal/MimeAlertModal';

// User-Agent string for a desktop browser (e.g., Chrome on Windows)
const desktopUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

//multi language
import { useTranslation } from '../../../context/LanguageContext';

import GlobalText from '@components/GlobalText/GlobalText';

//youtube player changes
import YoutubePlayer from 'react-native-youtube-iframe';

//static server
import StaticServer from 'react-native-static-server';

const StandAlonePlayer = ({ route }) => {
  //multi language setup
  const { t, language } = useTranslation();

  //for rtl
  const isRTL = I18nManager.isRTL;

  // Get safe area insets for better Android 15 compatibility
  const insets = useSafeAreaInsets();

  // Get screen dimensions for Android 15 compatibility
  const screenData = Dimensions.get('screen');
  const windowData = Dimensions.get('window');
  const statusBarHeight = StatusBar.currentHeight || 0;
  const navigationBarHeight = Math.max(
    0,
    screenData.height - windowData.height - statusBarHeight
  );

  // Use safe area insets if available, otherwise fallback to calculated values
  const topPadding =
    Platform.OS === 'android'
      ? insets.top > 0
        ? insets.top
        : statusBarHeight
      : 0;
  const bottomPadding =
    Platform.OS === 'android'
      ? insets.bottom > 0
        ? insets.bottom
        : Math.max(navigationBarHeight, 24)
      : 0;

  // Handle landscape orientation with side navigation buttons
  const leftPadding = Platform.OS === 'android' ? insets.left : 0;
  const rightPadding = Platform.OS === 'android' ? insets.right : 0;

  // Additional padding for landscape orientation to ensure content doesn't go behind side navigation
  const isLandscape = orientation === 'landscape';
  const landscapeLeftPadding =
    isLandscape && Platform.OS === 'android'
      ? Math.max(leftPadding, 8)
      : leftPadding;
  const landscapeRightPadding =
    isLandscape && Platform.OS === 'android'
      ? Math.max(rightPadding, 8)
      : rightPadding;

  // console.log('############### isRTL', isRTL);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingTop: topPadding,
      paddingBottom: bottomPadding,
      paddingLeft: landscapeLeftPadding,
      paddingRight: landscapeRightPadding,
    },
    webview: {
      flex: 1,
    },
    middle_screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    completionText: {
      fontSize: 24,
      fontFamily: 'Poppins-Medium',
      color: '#1F1B13',
      fontWeight: '600',
      marginBottom: 30,
      textAlign: 'center',
    },
    exitButton: {
      backgroundColor: '#FDBE16',
      borderRadius: 30,
      height: 60,
      width: '70%',
      maxWidth: 300,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    exitButtonText: {
      fontSize: 18,
      fontFamily: 'Roboto-Black',
      color: '#1F1B13',
      fontWeight: '700',
      textAlign: 'center',
    },
  });

  console.log('route', route);
  //get courseId and unitId in standalone player
  const navigation = useNavigation();
  const {
    content_do_id,
    content_mime_type,
    title,
    isOffline,
    course_id,
    unit_id,
    isRegistrationTest,
  } = route.params;
  // console.log('######### content_do_id', content_do_id);
  // console.log('######### content_mime_type', content_mime_type);
  // console.log('######### course_id', course_id);

  //back button handle

  useEffect(() => {
    const backAction = () => {
      navigation.goBack(); // Navigate back to the previous screen
      return true; // Returning true prevents the default behavior (exiting the app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Clean up the event listener on component unmount
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  //   ##content_mime_type

  //   #sunbird-content-player
  //   application/vnd.ekstep.ecml-archive
  //   application/vnd.ekstep.html-archive
  //   application/vnd.ekstep.h5p-archive
  //   video/x-youtube

  //   #sunbird-pdf-player
  //   application/pdf

  //   #sunbird-epub-player
  //   application/epub

  //   #sunbird-video-player
  //   video/webm
  //   video/mp4

  //   #sunbird-quml-player
  //   application/vnd.sunbird.question
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [courseId, setCourseId] = useState(
    course_id ? course_id : content_do_id
  );
  const [unitId, setUnitId] = useState(unit_id ? unit_id : content_do_id);

  const contentResumeData = useRef(null);

  // let contentResumeData = null;

  //resume data fetch from api
  useEffect(() => {
    if(userId){
      const resumeLoad = async()=>{
        let responseResume = await resumeTrackingStatus(userId,content_do_id,courseId,unitId);
        if(responseResume)
        {
          console.log("#resumedatatest",JSON.stringify(responseResume));
          if(responseResume && responseResume?.data?.length>0)
          {
            if(responseResume.data[0]?.resumeData && responseResume.data[0]?.resumeData!='' && responseResume.data[0].resumeData!=null)
            {
              // console.log("###########responseResume",responseResume.data[0].resumeData);
              contentResumeData.current = responseResume.data[0].resumeData.toString();
            }
          }
        }
        else
        {
          //check offline
          let offlineTrack = await getSyncTrackingOfflineCourse(
            userId,
            courseId
          );
          console.log(
            '#resumedatatest',
            JSON.stringify(offlineTrack)
          );
          if (offlineTrack) {
            for (let jj = 0; jj < offlineTrack.length; jj++) {
              let offlineTrackItem = offlineTrack[jj];
              let content_id = offlineTrackItem?.content_id;
              if(content_id==content_do_id) {
                try {
                  let detailsObject = JSON.parse(
                    offlineTrackItem?.detailsObject
                  );
                  for (let k = 0; k < detailsObject.length; k++) {
                    let eid = detailsObject[k]?.eid;
                    let edata = detailsObject[k]?.edata;
                    if (eid == 'PROGRESS') {
                      contentResumeData.current = edata?.resumeData;
                    }
                    // console.log(
                    //   '##### detailsObject length',
                    //   detailsObject[k]?.eid
                    // );
                  }
                } catch (e) {
                  console.log('e', e);
                }
              }
            }
          }
        }
        console.log("#resumedatatest contentResumeData",JSON.stringify(contentResumeData.current));
        setIsLoadContent(true);
      }
      resumeLoad();
    }
    console.log("#resumedatatest",JSON.stringify(userId));
  }, [userId]);

  //const [telemetryObject, setTelemetryObject] = useState([]);
  let telemetryObject = [];
  let contentEidSTART = [];
  let contentEidINTERACT = [];
  let contentEidEND = [];
  let contentEidPROGRESS = [];

  //youtube player end screen tracking
  const [youtubePlayerEndScreen, setYoutubePlayerEndScreen] = useState(false);

  useEffect(() => {
    // Lock the screen to landscape mode
    if (
      content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
      content_mime_type == 'video/x-youtube' ||
      content_mime_type == 'application/vnd.ekstep.h5p-archive' ||
      content_mime_type == 'video/mp4' ||
      content_mime_type == 'video/webm' ||
      // content_mime_type == 'audio/mp3' ||
      // content_mime_type == 'audio/wav' ||
      // content_mime_type == 'audio/mpeg' ||
      content_mime_type == 'application/vnd.ekstep.html-archive'
    ) {
      Orientation.lockToLandscape();
    }

    // Add orientation change listener for dynamic padding adjustment
    const orientationListener = Dimensions.addEventListener(
      'change',
      ({ screen }) => {
        const newOrientation =
          screen.width > screen.height ? 'landscape' : 'portrait';
        setOrientation(newOrientation);
      }
    );
                    
    const capitalizeName = (name) => {
      return name
        ?.split(' ') // Split the name by spaces into an array of words
        ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        ?.join(' '); // Join the words back into a single string
    };
    
    const fetchData = async () => {
      let tempUserId = await getDataFromStorage('userId');
      //get username
      // let tempUserName = await getDataFromStorage('Username');
      //get profile data firstname and lastname
      const resultProfileData = JSON.parse(await getDataFromStorage('profileData'));
      const tempUserName = resultProfileData?.getUserDetails?.[0]?.firstName &&
      resultProfileData?.getUserDetails?.[0]?.lastName &&
      capitalizeName(
        `${resultProfileData?.getUserDetails?.[0]?.firstName} ${resultProfileData?.getUserDetails?.[0]?.lastName}!`
      );
                    
      console.log('tempUserId', tempUserId);
      console.log('tempUserName', tempUserName);
      setUserId(tempUserId);
      setUserName(tempUserName);
      let contentType = '';
      content_mime_type == 'application/vnd.sunbird.questionset'
        ? (contentType = 'quml')
        : content_mime_type == 'application/vnd.ekstep.ecml-archive'
          ? (contentType = 'ecml')
          : content_mime_type == 'application/vnd.ekstep.h5p-archive'
            ? (contentType = 'h5p')
            : content_mime_type == 'application/vnd.ekstep.html-archive'
              ? (contentType = 'html')
              : content_mime_type == 'video/x-youtube'
                ? (contentType = 'youtube')
                : content_mime_type == 'application/pdf'
                  ? (contentType = 'pdf')
                  : content_mime_type == 'application/epub'
                    ? (contentType = 'epub')
                    : content_mime_type == 'video/mp4'
                      ? (contentType = 'mp4')
                      : content_mime_type == 'video/webm'
                        ? (contentType = 'webm')
                        : content_mime_type == 'audio/mp3'
                          ? (contentType = 'mp3')
                          : content_mime_type == 'audio/wav'
                            ? (contentType = 'wav')
                            : content_mime_type == 'audio/mpeg'
                              ? (contentType = 'mp3')
                              : '';
      await storeData('contentId', content_do_id, '');
      await storeData('contentType', contentType, '');
      await storeData('contentMimeType', content_mime_type, '');
      await storeData('courseId', courseId, '');
      await storeData('unitId', unitId, '');

      // setIsLoadContent(true);
    };
    fetchData();

    // Unlock orientation when component is unmounted
    return () => {
      Orientation.lockToPortrait();
      orientationListener?.remove();
    };
  }, []);

  //common compoennt variables
  const [lib_folder] = useState(
    content_mime_type == 'application/vnd.ekstep.h5p-archive'
    ? `content-player-${Config.CONTENT_PLAYER_VERSION}`
    : content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
      content_mime_type == 'video/x-youtube' ||
      content_mime_type == 'application/vnd.ekstep.html-archive'
      ? 'sunbird-content-player'
      : content_mime_type == 'application/pdf'
        ? 'sunbird-pdf-player'
        : content_mime_type == 'application/vnd.sunbird.questionset'
          ? 'sunbird-quml-player'
          : content_mime_type == 'video/mp4' ||
              content_mime_type == 'video/webm' ||
              content_mime_type == 'audio/mp3' ||
              content_mime_type == 'audio/wav' ||
              content_mime_type == 'audio/mpeg'
            ? 'sunbird-video-player'
            : content_mime_type == 'application/epub'
              ? 'sunbird-epub-player'
              : ''
  );
  const [lib_file] = useState(
    content_mime_type == 'application/vnd.sunbird.questionset'
      ? 'index.html'
      : content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
          content_mime_type == 'application/pdf' ||
          content_mime_type == 'video/mp4' ||
          content_mime_type == 'video/webm' ||
          content_mime_type == 'audio/mp3' ||
          content_mime_type == 'audio/wav' ||
          content_mime_type == 'audio/mpeg' ||
          content_mime_type == 'video/x-youtube' ||
          content_mime_type == 'application/vnd.ekstep.html-archive' ||
          content_mime_type == 'application/vnd.ekstep.h5p-archive' ||
          content_mime_type == 'application/epub'
        ? 'index.html'
        : ''
  );

  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState(false);
  const [errorDetail, setErrorDetail] = useState('unsupported_content');
  const [orientation, setOrientation] = useState(
    screenData.width > screenData.height ? 'landscape' : 'portrait'
  );
  const content_file = `${RNFS.DocumentDirectoryPath}/${content_do_id}`;
  const streamingPath =
    content_mime_type == 'application/vnd.ekstep.ecml-archive'
      ? `${content_file}`
      : content_mime_type == 'application/vnd.ekstep.html-archive'
        ? `${content_file}/assets/public/content/html/${content_do_id}-latest`
        : content_mime_type == 'application/vnd.ekstep.h5p-archive'
          ? `${content_file}/assets/public/content/h5p/${content_do_id}-latest`
          : `${content_file}/${content_do_id}.json`;
  // console.log('rnfs DocumentDirectoryPath', RNFS.DocumentDirectoryPath);
  // console.log('rnfs ExternalDirectoryPath', RNFS.ExternalDirectoryPath);
  const [is_valid_file, set_is_valid_file] = useState(null);
  const [is_download, set_is_download] = useState(null);
  const questionListUrl = Config.QUESTION_LIST_URL;
  const [progress, setProgress] = useState(0);
  const [loading_text, set_loading_text] = useState('');
  const [modal, setModal] = useState(false);
  // Determine the correct path to the index.html file based on the platform
  const htmlFilePath = Platform.select({
    ios: `./assets/assets/libs/${lib_folder}/${lib_file}`,
    android: `file:///android_asset/libs/${lib_folder}/${lib_file}`,
  });

  //server start
  let publicLocal=RNFS.DocumentDirectoryPath;
  let urlLocal='http://localhost:8080';
  let serverInstance = null;
  useEffect(() => {
    const initialSetup=async()=>{
      setLoading(true);
      serverInstance = new StaticServer(
        8080,
        `${publicLocal}`,
        {
          localOnly: true,
        }
      );
      serverInstance.start().then((url) => {
        console.log('####Server started at', url);
        // urlLocal=url;
        // http://localhost:8080
      });
      setLoading(false);
    }
    initialSetup();
    return () => {
      if(serverInstance)
      {
        serverInstance.stop();
        console.log('####Server stopped',urlLocal);
      }
    };
  }, []);
  //server end

  //set data from react native
  const webviewRef = useRef(null);
  const totalDurationResolverRef = useRef(null);
  // webview event
  const handleNavigationStateChange = (navState) => {
    console.log('Current URL:', navState.url);
  };
  //reads localStorage.totalDuration set by the webview's own player on the END event
  const getTotalDurationFromWebView = () => {
    return new Promise((resolve) => {
      totalDurationResolverRef.current = resolve;
      webviewRef.current?.injectJavaScript(`
        (function() {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ totalDurationValue: localStorage.getItem('totalDuration') }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ totalDurationValue: null }));
          }
        })();
        true;
      `);
      //webview may never respond (page navigated away, etc.), so don't hang forever
      setTimeout(() => {
        if (totalDurationResolverRef.current) {
          totalDurationResolverRef.current(null);
          totalDurationResolverRef.current = null;
        }
      }, 1000);
    });
  };
  const handleMessage = async (event) => {
    try {
      //get telemetry save
      const data = event.nativeEvent.data;
      console.log('data_obj data', JSON.stringify(event.nativeEvent));
      let jsonObj = JSON.parse(data);
      if (jsonObj?.totalDurationValue !== undefined && totalDurationResolverRef.current) {
        totalDurationResolverRef.current(jsonObj.totalDurationValue);
        totalDurationResolverRef.current = null;
        return;
      }
      let data_obj = jsonObj.data;
      let data_event = jsonObj?.event;
      let youtubeExit = jsonObj?.youtube;
      //for youtubeExit
      if (youtubeExit && youtubeExit == 'Exit') {
        // console.log('####################');
        // console.log(
        //   'data_obj playerevent youtube',
        //   JSON.stringify(youtubeExit)
        // );
        // console.log('####################');
        contentEidEND = [
          {
            eid: 'END',
            edata: {
              duration: 0,
              mode: 'play',
              pageid: 'sunbird-player-Endpage',
              summary: [
                {
                  progress: 100,
                },
                {
                  totallength: '',
                },
                {
                  visitedlength: '',
                },
                {
                  visitedcontentend: '',
                },
                {
                  totalseekedlength: '',
                },
                {
                  endpageseen: false,
                },
              ],
              type: 'content',
            },
          },
        ];
        await storeData(content_do_id+'contentEidEND', contentEidEND, 'json');
        //check if exit button pressed
        fetchExitData();
        navigation.goBack();
      }
      //check telemetry
      if (data_obj && data_event != 'playerevent') {
        //add user id in actor
        try {
          data_obj.actor.id = userId;
        } catch (e) {
          console.log('error', e);
        }
        // console.log('####################');
        // console.log('data_obj telemetry', JSON.stringify(data_obj));
        // console.log('####################');
        //setTelemetryObject((telemetryObject) => [...telemetryObject, data_obj]);
        telemetryObject.push(data_obj);
        //console.log('telemetryObject', telemetryObject);
        await storeData('telemetryObject', telemetryObject, 'json');

        //content tracking
        if (data_obj?.eid == 'START') {
          contentEidSTART = [
            {
              eid: data_obj.eid,
              edata: data_obj.edata,
            },
          ];
          await storeData(content_do_id+'contentEidSTART', contentEidSTART, 'json');
        }
        if (data_obj?.eid == 'INTERACT') {
          contentEidINTERACT = [
            {
              eid: data_obj.eid,
              edata: data_obj.edata,
            },
          ];
          await storeData(content_do_id+'contentEidINTERACT', contentEidINTERACT, 'json');
        }
        if (
          data_obj?.eid == 'END' ||
          data_obj?.edata?.type == 'END' ||
          data_obj?.eid == 'SUMMARY'
        ) {
          contentEidEND = [
            {
              eid: 'END',
              edata: data_obj.edata,
            },
          ];
          await storeData(content_do_id+'contentEidEND', contentEidEND, 'json');
        }
      }
      //check playerevent
      if (data_obj && data_event == 'playerevent') {
        // console.log('####################');
        console.log('data_obj playerevent', JSON.stringify(data_obj));
        // console.log('####################');
        //check if exit button pressed
        if (data_obj?.eid == 'HEARTBEAT' && data_obj?.edata?.type == 'EXIT') {
          fetchExitData();
          navigation.goBack();
        }
      }
      //check telemetry in new player
      if (jsonObj && jsonObj?.type == 'telemetry') {
        let details=jsonObj?.detail;
        //add user id in actor
        try {
          details.actor.id = userId;
        } catch (e) {
          console.log('error', e);
        }
        // console.log('####################');
        // console.log('details telemetry', JSON.stringify(details));
        // console.log('####################');
        //setTelemetryObject((telemetryObject) => [...telemetryObject, details]);
        telemetryObject.push(details);
        //console.log('telemetryObject', telemetryObject);
        await storeData('telemetryObject', telemetryObject, 'json');

        //content tracking
        if (details?.eid == 'START') {
          contentEidSTART = [
            {
              eid: details.eid,
              edata: details.edata,
            },
          ];
          await storeData(content_do_id+'contentEidSTART', contentEidSTART, 'json');
        }
        if (details?.eid == 'INTERACT') {
          contentEidINTERACT = [
            {
              eid: details.eid,
              edata: details.edata,
            },
          ];
          await storeData(content_do_id+'contentEidINTERACT', contentEidINTERACT, 'json');
        }
        if (details?.eid == 'PROGRESS' && details?.edata?.resumeData!='' && content_mime_type != 'application/epub') {
          contentEidPROGRESS = [
            {
              eid: details.eid,
              edata: details.edata,
            },
          ];
          await storeData(content_do_id+'contentEidPROGRESS', contentEidPROGRESS, 'json');
        }
        if (
          details?.eid == 'END' ||
          details?.edata?.type == 'END' ||
          details?.eid == 'SUMMARY'
        ) {
          contentEidEND = [
            {
              eid: 'END',
              edata: details.edata,
            },
          ];
          await storeData(content_do_id+'contentEidEND', contentEidEND, 'json');
        }
      }
      //check for content player event close player
      console.log('data_obj playerevent', JSON.stringify(jsonObj));
      if (jsonObj && jsonObj?.type == 'player:close') {
          //full screen back button portrait
          console.log('fullscreen close', JSON.stringify(jsonObj));
          //release any native fullscreen/orientation lock held by the webview's
          //own video/screen-orientation API before forcing portrait natively,
          //otherwise the webview re-asserts landscape and the lock is ignored
          webviewRef.current?.injectJavaScript(`
            (function() {
              try {
                if (document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen();
                } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
                  document.webkitExitFullscreen();
                }
              } catch (e) {}
              try {
                if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
                  window.screen.orientation.unlock();
                }
              } catch (e) {}
            })();
            true;
          `);
          Orientation.lockToPortrait();
          //re-assert shortly after: the webview can reapply its own landscape
          //lock asynchronously right after exiting fullscreen, overriding the call above
          setTimeout(() => {
            Orientation.lockToPortrait();
          }, 300);
          fetchExitData();
          navigation.goBack();
      }
      //for assessment
      if (
        jsonObj?.scoreDetails &&
        content_mime_type == 'application/vnd.sunbird.questionset'
      ) {
        setLoading(true);
        set_loading_text('Sending Result...');
        try {
          const data = event.nativeEvent.data;
          let jsonObj = JSON.parse(data);
          let scoreDetails = jsonObj.scoreDetails;
          let identifierWithoutImg = jsonObj.identifierWithoutImg;
          let maxScore = jsonObj.maxScore;

          let totalDurationFromStorage = await getTotalDurationFromWebView();
          let seconds =
            totalDurationFromStorage != null
              ? Number(totalDurationFromStorage)
              : jsonObj.seconds;
          console.log(
            '####### debug timespent scoreDetails',
            JSON.stringify(scoreDetails)
          );
          console.log('identifierWithoutImg', identifierWithoutImg);
          console.log('####### debug timespent maxScore', maxScore);
          console.log('####### debug timespent seconds', seconds);
          // let userId = 'fb6b2e58-0f14-4d4f-90e4-bae092e7a951';
          let lastAttemptedOn = new Date().toISOString();

          let create_assessment = await assessmentTracking(
            scoreDetails,
            identifierWithoutImg,
            maxScore,
            seconds,
            userId,
            lastAttemptedOn,
            courseId,
            unitId
          );

          //add manual end event
          let storedContentEidEND = await getData(content_do_id+'contentEidEND', 'json');
          console.log("storedContentEidEND firstfetch",JSON.stringify(storedContentEidEND));
          if(!storedContentEidEND || storedContentEidEND?.length==0)
          {
            contentEidEND = [
              {
                eid: 'END',
                edata: {"type":"content","mode":"play","starttime":0,"endtime":0,"timespent":0.88,"pageviews":0,"interactions":0,"extra":[{"id":"progress","value":"100"},{"id":"endpageseen","value":"true"},{"id":"score","value":seconds},{"id":"correct","value":"0"},{"id":"incorrect","value":"0"},{"id":"partial","value":"0"},{"id":"skipped","value":"0"}]},
              },
            ];
            await storeData(content_do_id+'contentEidEND', contentEidEND, 'json');
            console.log("stored contentEidEND for assessments",contentEidEND);
          }

          // console.log('############# create_assessment', create_assessment);
          if (
            create_assessment &&
            create_assessment?.response?.responseCode == 201
          ) {
            let exam_data = JSON.parse(create_assessment?.data);
            const percentage =
              (exam_data?.totalScore / exam_data?.totalMaxScore) * 100;
            const roundedPercentage = percentage.toFixed(2); // Rounds to 2 decimal places
            setModal(exam_data);
          } else {
            let payload = {
              scoreDetails,
              identifierWithoutImg,
              maxScore,
              seconds,
              userId,
              lastAttemptedOn,
              courseId,
              unitId,
            };
            //store result in offline mode
            await storeAsessmentOffline(userId, identifierWithoutImg, payload);
            console.log(
              '############# create_assessment offline',
              create_assessment
            );
            if (create_assessment && create_assessment?.data) {
              let exam_data = JSON.parse(create_assessment?.data);
              const percentage =
                (exam_data?.totalScore / exam_data?.totalMaxScore) * 100;
              const roundedPercentage = percentage.toFixed(2); // Rounds to 2 decimal places
              setModal(exam_data);
            } else {
              setModal(true);
            }
          }
          set_loading_text('');
          setLoading(false);
        } catch (e) {
          console.log('error', e);
        }
        //setRetrievedData(data);
        //sent assessments track
        fetchExitData();
      }
    } catch (e) {
      console.log('error', e);
    }
  };

  const fetchDataQuml = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    let contentObj = await getData(content_do_id, 'json');
    //console.log('################# contentObj set', contentObj);

    if (contentObj == null) {
      set_is_download(true);
      await downloadContentQuML();
    } else {
      let filePath = '';
      if (contentObj?.mimeType == 'application/vnd.sunbird.questionset') {
        filePath = `${content_file}`;
      }
      if (filePath != '') {
        try {
          //get file content
          const content = await RNFS.readFile(streamingPath, 'utf8');
          if (content) {
            try {
              let file_content = JSON.parse(content);
              console.log(
                '############## file_content',
                JSON.stringify(file_content)
              );
              //console.log('file_content', file_content);
              questionsData.questions_data = file_content;
              qumlPlayerConfig.metadata = contentObj;
              //set user id and full name
              qumlPlayerConfig.context.uid = userId;
              qumlPlayerConfig.context.userData = {
                firstName: userName,
                lastName: '',
              };
              //fix for maxScore getting zero in backend then do not play the content
              let maxScore_Temp = contentObj?.maxScore;
              if (!maxScore_Temp) {
                maxScore_Temp =
                  contentObj?.outcomeDeclaration?.maxScore?.defaultValue;
              }
              if (
                maxScore_Temp == 0 ||
                maxScore_Temp == null ||
                maxScore_Temp == undefined ||
                maxScore_Temp == '0'
              ) {
                setAlertModal(true);
                setErrorDetail('unsupported_content');
              }
              // console.log(
              //   '################# qumlPlayerConfig',
              //   JSON.stringify(qumlPlayerConfig)
              // );
              set_is_valid_file(true);
            } catch (e) {
              console.log(e);
              set_is_download(true);
              await downloadContentQuML();
            }
          } else {
            set_is_download(true);
            await downloadContentQuML();
          }
        } catch (e) {
          set_is_valid_file(false);
        }
      } else {
        set_is_valid_file(false);
      }
      set_is_download(false);
    }
    set_loading_text('');
    setLoading(false);
  };

  const fetchDataEcml = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    let contentObj = await getData(content_do_id, 'json');
    if (contentObj == null) {
      //download start
      set_is_download(true);
      await downloadContentECMLH5pHTMLYoutube();
    } else {
      let filePath = '';
      if (contentObj?.mimeType == 'application/vnd.ekstep.ecml-archive') {
        filePath = `${content_file}.zip`;
      }
      if (filePath != '') {
        try {
          contentPlayerConfig.metadata = contentObj;
          contentPlayerConfig.data = contentObj?.body;
          contentPlayerConfig.context = {
            host: `file://${content_file}/assets`,
            contentId: content_do_id,
          };
          //set user id and full name
          contentPlayerConfig.context.uid = userId;
          contentPlayerConfig.context.userData = {
            firstName: userName,
            lastName: '',
          };
          contentPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
          "primary": "#DDA613", //FDBE16
          "toolbar": "rgba(30,5,20,0.97)",
          "background": "#1a0512"
          }};
          //console.log('contentPlayerConfig set', contentPlayerConfig);
          set_is_valid_file(true);
        } catch (e) {
          set_is_valid_file(false);
        }
      } else {
        set_is_valid_file(false);
      }
      set_is_download(false);
    }
    set_loading_text('');
    setLoading(false);
  };

  const fetchDataHtmlH5pYoutube = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    let contentObj = await getData(content_do_id, 'json');
    if (contentObj == null) {
      //download start
      set_is_download(true);
      await downloadContentECMLH5pHTMLYoutube();
    } else {
      let filePath = '';
      if (
        contentObj?.mimeType == 'application/vnd.ekstep.html-archive' ||
        contentObj?.mimeType == 'application/vnd.ekstep.h5p-archive' ||
        contentObj?.mimeType == 'video/x-youtube'
      ) {
        filePath = `${content_file}.zip`;
      }
      if (filePath != '') {
        try {
          contentPlayerConfig.metadata = contentObj;
          contentPlayerConfig.data = '';
          contentPlayerConfig.context = {
            host: `file://${content_file}`,
            contentId: content_do_id,
          };
          //set user id and full name
          contentPlayerConfig.context.uid = userId;
          contentPlayerConfig.context.userData = {
            firstName: userName,
            lastName: '',
          };
          contentPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
          "primary": "#DDA613", //FDBE16
          "toolbar": "rgba(30,5,20,0.97)",
          "background": "#1a0512"
          }};

          //h5p player path change
          if(contentObj?.mimeType == 'application/vnd.ekstep.h5p-archive')
          {
            // contentPlayerConfig.metadata.streamingUrl=`file://${content_file}/assets/public/content/h5p/${content_do_id}-latest/content`;
            // ##################################
            contentPlayerConfig.metadata.streamingUrl=`http://127.0.0.1:8080/${content_do_id}/assets/public/content/h5p/${content_do_id}-latest/content`;
            delete contentPlayerConfig.context.host;
            delete contentPlayerConfig.context.contentId;
const path =
  `${RNFS.DocumentDirectoryPath}/${content_do_id}/assets/public/content/h5p/${content_do_id}-latest/content/h5p.json`;

const exists = await RNFS.exists(path);

console.log('#### h5p.json exists', exists);
fetch(
  `http://127.0.0.1:8080/${content_do_id}/assets/public/content/h5p/${content_do_id}-latest/content/h5p.json`
)
.then(r => {
  console.log('######server STATUS', r.status);
  return r.text();
})
.then(t => {
  console.log('######server DATA', t);
})
.catch(e => {
  console.log('FETCH ERROR', e);
});
          }

          console.log(
            'contentPlayerConfig set json',
            JSON.stringify(contentPlayerConfig)
          );
          set_is_valid_file(true);
        } catch (e) {
          set_is_valid_file(false);
        }
      } else {
        set_is_valid_file(false);
      }
      set_is_download(false);
    }
    set_loading_text('');
    setLoading(false);
  };

  const fetchDataPdfVideoEpub = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    try {
      let contentObj = await getData(content_do_id, 'json');
      if (contentObj == null) {
        //no offline content found
        //play online directly
        let content_response = await readContent(content_do_id);
        if (content_response == null) {
          //Alert.alert('Error', 'Internet is not available', [{ text: 'OK' }]);
          setAlertModal(true);
          setErrorDetail('content_not_in_device');
          set_is_valid_file(false);
        } else {
          let contentObj = content_response?.result?.content;
          if (
            contentObj?.mimeType == 'application/pdf' ||
            contentObj?.mimeType == 'video/mp4' ||
            contentObj?.mimeType == 'video/webm' ||
            contentObj?.mimeType == 'audio/mp3' ||
            contentObj?.mimeType == 'audio/wav' ||
            contentObj?.mimeType == 'audio/mpeg' ||
            contentObj?.mimeType == 'application/epub'
          ) {
            if (contentObj?.mimeType == 'application/pdf') {
              pdfPlayerConfig.metadata = contentObj;
              //set user id and full name
              pdfPlayerConfig.context.uid = userId;
              pdfPlayerConfig.context.userData = {
                firstName: userName,
                lastName: '',
              };
              pdfPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
              "primary": "#DDA613", //FDBE16
              "toolbar": "rgba(30,5,20,0.97)",
              "background": "#1a0512"
              }};
              console.log('pdfPlayerConfig set contentResumeData', contentResumeData.current);
              console.log('pdfPlayerConfig set', pdfPlayerConfig);
            }
            if (
              contentObj?.mimeType == 'video/mp4' ||
              contentObj?.mimeType == 'video/webm' ||
              contentObj?.mimeType == 'audio/mp3' ||
              contentObj?.mimeType == 'audio/wav' ||
              contentObj?.mimeType == 'audio/mpeg'
            ) {
              videoPlayerConfig.metadata = contentObj;
              //set user id and full name
              videoPlayerConfig.context.uid = userId;
              videoPlayerConfig.context.userData = {
                firstName: userName,
                lastName: '',
              };
              videoPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
              "primary": "#DDA613", //FDBE16
              "toolbar": "rgba(30,5,20,0.97)",
              "background": "#1a0512"
              }};
              //console.log('videoPlayerConfig set', videoPlayerConfig);
            }
            if (contentObj?.mimeType == 'application/epub') {
              epubPlayerConfig.metadata = contentObj;
              //set user id and full name
              epubPlayerConfig.context.uid = userId;
              epubPlayerConfig.context.userData = {
                firstName: userName,
                lastName: '',
              };
              epubPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
              "primary": "#DDA613", //FDBE16
              "toolbar": "rgba(30,5,20,0.97)",
              "background": "#1a0512"
              }};
              //console.log('epubPlayerConfig set', epubPlayerConfig);
            }
            set_is_valid_file(true);
          } else {
            set_is_valid_file(false);
            Alert.alert('Error', 'Invalid File', [{ text: 'OK' }]);
          }
        }
      } else if (
        contentObj?.mimeType == 'application/pdf' ||
        contentObj?.mimeType == 'video/mp4' ||
        contentObj?.mimeType == 'video/webm' ||
        contentObj?.mimeType == 'audio/mp3' ||
        contentObj?.mimeType == 'audio/wav' ||
        contentObj?.mimeType == 'audio/mpeg' ||
        contentObj?.mimeType == 'application/epub'
      ) {
        //play offline content
        //get content file name
        let temp_file_url = contentObj?.artifactUrl;
        const dividedArray = temp_file_url.split(content_do_id);
        const file_name =
          dividedArray[
            dividedArray.length > 0
              ? dividedArray.length - 1
              : dividedArray.length
          ];
        filePath = `http://127.0.0.1:8080/${content_do_id}/${content_do_id}${file_name}`;
        //console.log('filePath', filePath);
        //console.log('create blob url');
        contentObj.artifactUrl = filePath;

        //previewUrl streamingUrl no needed for offline use
        delete contentObj.previewUrl;
        delete contentObj.streamingUrl;
        if (contentObj?.mimeType == 'application/pdf') {
          pdfPlayerConfig.metadata = contentObj;
          //set user id and full name
          pdfPlayerConfig.context.uid = userId;
          pdfPlayerConfig.context.userData = {
            firstName: userName,
            lastName: '',
          };
          pdfPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
          "primary": "#DDA613", //FDBE16
          "toolbar": "rgba(30,5,20,0.97)",
          "background": "#1a0512"
          }};
          console.log('pdfPlayerConfig set contentResumeData', contentResumeData.current);
          console.log('pdfPlayerConfig set', pdfPlayerConfig);
        }
        if (
          contentObj?.mimeType == 'video/mp4' ||
          contentObj?.mimeType == 'video/webm' ||
          contentObj?.mimeType == 'audio/mp3' ||
          contentObj?.mimeType == 'audio/wav' ||
          contentObj?.mimeType == 'audio/mpeg'
        ) {
          videoPlayerConfig.metadata = contentObj;
          //set user id and full name
          videoPlayerConfig.context.uid = userId;
          videoPlayerConfig.context.userData = {
            firstName: userName,
            lastName: '',
          };
          videoPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
          "primary": "#DDA613", //FDBE16
          "toolbar": "rgba(30,5,20,0.97)",
          "background": "#1a0512"
          }};
          //console.log('videoPlayerConfig set', videoPlayerConfig);
        }
        if (contentObj?.mimeType == 'application/epub') {
          epubPlayerConfig.metadata = contentObj;
          //set user id and full name
          epubPlayerConfig.context.uid = userId;
          epubPlayerConfig.context.userData = {
            firstName: userName,
            lastName: '',
          };
          epubPlayerConfig.extra={...(contentResumeData.current? {resumeData:contentResumeData.current} : {}),"theme": {
          "primary": "#DDA613", //FDBE16
          "toolbar": "rgba(30,5,20,0.97)",
          "background": "#1a0512"
          }};
          //console.log('epubPlayerConfig set', epubPlayerConfig);
        }
        set_is_valid_file(true);
      } else {
        //invalid file
        set_is_valid_file(false);
        Alert.alert('Error', 'Invalid File', [{ text: 'OK' }]);
      }
    } catch (e) {
      set_is_valid_file(false);
      Alert.alert('Error', 'Invalid File', [{ text: 'OK' }]);
    }
    set_is_download(false);
    set_loading_text('');
    setLoading(false);
  };

  const [temp] = useState([]);
  const [isLoadContent, setIsLoadContent] = useState(false);
  useEffect(() => {
    if (isLoadContent===true) {
      content_mime_type == 'application/vnd.ekstep.ecml-archive'
        ? fetchDataEcml()
        : content_mime_type == 'video/x-youtube' ||
            content_mime_type == 'application/vnd.ekstep.html-archive' ||
            content_mime_type == 'application/vnd.ekstep.h5p-archive'
          ? fetchDataHtmlH5pYoutube()
          : content_mime_type == 'application/pdf' ||
              content_mime_type == 'video/mp4' ||
              content_mime_type == 'video/webm' ||
              content_mime_type == 'audio/mp3' ||
              content_mime_type == 'audio/wav' ||
              content_mime_type == 'audio/mpeg' ||
              content_mime_type == 'application/epub'
            ? fetchDataPdfVideoEpub()
            : content_mime_type == 'application/vnd.sunbird.questionset'
              ? fetchDataQuml()
              : '';
    }
  }, [isLoadContent, userName]);
  useEffect(() => {
    const fetchData = async () => {
      if (
        content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
        content_mime_type == 'video/x-youtube' ||
        content_mime_type == 'application/vnd.ekstep.html-archive' ||
        content_mime_type == 'application/vnd.ekstep.h5p-archive' ||
        content_mime_type == 'application/pdf' ||
        content_mime_type == 'video/mp4' ||
        content_mime_type == 'video/webm' ||
        content_mime_type == 'audio/mp3' ||
        content_mime_type == 'audio/wav' ||
        content_mime_type == 'audio/mpeg' ||
        content_mime_type == 'application/epub' ||
        content_mime_type == 'application/vnd.sunbird.questionset'
      ) {
        setAlertModal(false);
      } else {
        setAlertModal(true);
        setErrorDetail('unsupported_content');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const downloadContentECMLH5pHTMLYoutube = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    //get data online
    let content_response = await readContent(content_do_id);
    if (content_response == null) {
      //Alert.alert('Error', 'Internet is not available', [{ text: 'OK' }]);
      setAlertModal(true);
      setErrorDetail('content_not_in_device');
      set_is_valid_file(false);
    } else {
      let contentObj = content_response?.result?.content;
      let filePath = '';
      if (
        contentObj?.mimeType == 'application/vnd.ekstep.ecml-archive' ||
        contentObj?.mimeType == 'application/vnd.ekstep.html-archive' ||
        contentObj?.mimeType == 'application/vnd.ekstep.h5p-archive' ||
        contentObj?.mimeType == 'video/x-youtube'
      ) {
        filePath = `${content_file}.zip`;
      }
      if (filePath != '') {
        //download file and store object in local
        //download file
        // URL of the file to download
        //const fileUrl = contentObj?.artifactUrl;
        const fileUrl = contentObj?.downloadUrl;
        //console.log('fileUrl', fileUrl);
        try {
          if (contentObj?.mimeType == 'video/x-youtube') {
            //console.log('permission got');
            //store content obj
            //console.log(contentObj);
            await storeData(content_do_id, contentObj, 'json');
            await fetchDataHtmlH5pYoutube();
          } else {
            //console.log('permission got');
            try {
              const download = RNFS.downloadFile({
                fromUrl: fileUrl,
                toFile: filePath,
                begin: (res) => {
                  console.log('Download started');
                },
                progress: (res) => {
                  const progressPercent =
                    (res.bytesWritten / res.contentLength) * 100;
                  setProgress(progressPercent);
                },
              });
              const result = await download.promise;
              if (result.statusCode === 200) {
                console.log('File downloaded successfully:', filePath);
                setProgress(0);
                set_loading_text('Unzip content ecar file...');
                // Define the paths
                const sourcePath = filePath;
                const targetPath = content_file;
                try {
                  // Ensure the target directory exists
                  await RNFS.mkdir(targetPath);
                  // Unzip the file
                  const path = await unzip(sourcePath, targetPath);
                  console.log(`Unzipped to ${path}`);
                  //content unzip in content folder
                  //get content file name
                  let temp_file_url = contentObj?.artifactUrl;
                  const dividedArray = temp_file_url.split('artifact');
                  const file_name =
                    dividedArray[
                      dividedArray.length > 0
                        ? dividedArray.length - 1
                        : dividedArray.length
                    ];
                  // Define the paths
                  const sourcePath_internal = `${content_file}/${content_do_id}${file_name}`;
                  const targetPath_internal = streamingPath;

                  sourcePath_internal.replace('.zip', '');
                  try {
                    // Ensure the target directory exists
                    await RNFS.mkdir(targetPath_internal);
                    // Unzip the file
                    const path = await unzip(
                      sourcePath_internal,
                      targetPath_internal
                    );
                    console.log(`Unzipped to ${path}`);
                    //store content obj
                    console.log(contentObj);
                    await storeData(content_do_id, contentObj, 'json');
                    contentObj?.mimeType ==
                    'application/vnd.ekstep.ecml-archive'
                      ? fetchDataEcml()
                      : contentObj?.mimeType ==
                            'application/vnd.ekstep.html-archive' ||
                          contentObj?.mimeType ==
                            'application/vnd.ekstep.h5p-archive'
                        ? await fetchDataHtmlH5pYoutube()
                        : '';
                  } catch (error) {
                    console.error(`Error extracting zip file: ${error}`);
                  }
                } catch (error) {
                  console.error(`Error extracting zip file: ${error}`);
                }
              } else {
                Alert.alert(
                  'Error Internal',
                  `Failed to download file: ${JSON.stringify(result)}`,
                  [{ text: 'OK' }]
                );
                console.log('Failed to download file:', result.statusCode);
              }
            } catch (error) {
              Alert.alert('Error Catch', `Failed to download file: ${error}`, [
                { text: 'OK' },
              ]);
              console.error('Error downloading file:', error);
            }
          }
        } catch (err) {
          Alert.alert('Error Catch', `Failed to download file: ${err}`, [
            { text: 'OK' },
          ]);
          console.log('display error', err);
        }
      } else {
        set_is_valid_file(false);
      }
    }
    //content read
    setLoading(false);
  };

  const downloadContentQuML = async () => {
    //content read
    setLoading(true);
    set_loading_text('Reading Content...');
    //get data online
    let content_response = await hierarchyContent(content_do_id);
    if (content_response == null) {
      //Alert.alert('Error', 'Internet is not available', [{ text: 'OK' }]);
      setAlertModal(true);
      setErrorDetail('content_not_in_device');
      set_is_valid_file(false);
    } else {
      let contentObj = content_response?.result?.questionSet;
      //fix for response with questionset
      if (!contentObj) {
        contentObj = content_response?.result?.questionset;
      }
      //console.log('######## contentObj', contentObj);
      let filePath = '';
      if (contentObj?.mimeType == 'application/vnd.sunbird.questionset') {
        //find outcomeDeclaration
        let questionsetRead_response = await questionsetRead(content_do_id);

        // console.log(
        //   '######## questionsetRead_response',
        //   questionsetRead_response
        // );
        if (
          questionsetRead_response != null &&
          questionsetRead_response?.result?.questionset
        ) {
          contentObj.outcomeDeclaration =
            questionsetRead_response?.result?.questionset?.outcomeDeclaration;
        }
        filePath = `${content_file}`;
      }
      //console.log('######## ', contentObj);
      //console.log('######## filePath', filePath);
      //console.log('######## ');
      if (filePath != '') {
        //create file and store object in local
        try {
          //console.log('permission got');
          try {
            //create directory
            set_loading_text('Creating Folder...');
            await RNFS.mkdir(filePath);
            console.log('folder created successfully:', filePath);
            //create directory and add json file in it
            set_loading_text('Downloading questionset...');
            //downlaod here
            let childNodes = contentObj?.childNodes;
            //console.log('childNodes', childNodes);
            let removeNodes = [];
            if (contentObj?.children) {
              for (let i = 0; i < contentObj.children.length; i++) {
                if (contentObj.children[i]?.identifier) {
                  removeNodes.push(contentObj.children[i].identifier);
                }
              }
            }
            //console.log('removeNodes', removeNodes);
            let identifiers = childNodes.filter(
              (item) => !removeNodes.includes(item)
            );
            //console.log('identifiers', identifiers);
            let questions = [];
            const chunks = [];
            let chunkSize = 10;
            for (let i = 0; i < identifiers.length; i += chunkSize) {
              chunks.push(identifiers.slice(i, i + chunkSize));
            }
            console.log('chunks', chunks);
            for (const chunk of chunks) {
              let response_question = await listQuestion(
                questionListUrl,
                chunk
              );
              if (response_question?.result?.questions) {
                for (
                  let i = 0;
                  i < response_question.result.questions.length;
                  i++
                ) {
                  questions.push(response_question.result.questions[i]);
                }
                //console.log('chunk', chunk);
                //console.log('response_question', response_question);
              }
            }
            console.log('questions', questions.length);
            console.log('identifiers', identifiers.length);
            if (questions.length == identifiers.length) {
              //add questions in contentObj for offline use
              let temp_contentObj = contentObj;
              if (contentObj?.children) {
                for (let i = 0; i < contentObj.children.length; i++) {
                  if (contentObj.children[i]?.children) {
                    for (
                      let j = 0;
                      j < contentObj.children[i]?.children.length;
                      j++
                    ) {
                      let temp_obj = contentObj.children[i]?.children[j];
                      if (temp_obj?.identifier) {
                        // Example usage
                        const identifierToFind = temp_obj.identifier;
                        const result_question = findObjectByIdentifier(
                          questions,
                          identifierToFind
                        );
                        //replace with question
                        temp_contentObj.children[i].children[j] =
                          result_question;
                      }
                    }
                  }
                }
              }
              contentObj = temp_contentObj;
              //end add questions in contentObj for offline use

              let question_result = {
                questions: questions,
                count: questions.length,
              };
              let file_content = { result: question_result };
              set_loading_text('Creating File...');
              await RNFS.writeFile(
                streamingPath,
                JSON.stringify(file_content),
                'utf8'
              );
              console.log('file created successfully:', streamingPath);
              //store content obj
              //console.log(contentObj);
              await storeData(content_do_id, contentObj, 'json');
              await fetchDataQuml();
            } else {
              Alert.alert('Error', 'Invalid File', [{ text: 'OK' }]);
            }
            //end download
          } catch (error) {
            Alert.alert('Error Catch', `Failed to create file: ${error}`, [
              { text: 'OK' },
            ]);
            console.error('Error creating file:', error);
          }
        } catch (err) {
          Alert.alert('Error Catch', `Failed to create file: ${err}`, [
            { text: 'OK' },
          ]);
          console.log('display error', err);
        }
      } else {
        Alert.alert('Error', 'Invalid File', [{ text: 'OK' }]);
      }
    }
    //content read
    setLoading(false);
  };

  // New zoom-disabling script
  const disableZoomJS = `
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.head.appendChild(meta);
`;

  //call content url
  let injectedJS =
    content_mime_type == 'application/vnd.sunbird.questionset'
      ? `(function() {
            localStorage.setItem('qumlPlayerObject', JSON.stringify(${JSON.stringify(
              {
                qumlPlayerConfig: qumlPlayerConfig,
                //for online
                //questionListUrl: questionListUrl,
                //for offline
                questionListUrl: '/list/questions',
              }
            )}));
            localStorage.setItem('questions_data', JSON.stringify(${JSON.stringify(
              {
                questions_data: questionsData.questions_data,
              }
            )}));
            window.setData();
        })(); ${disableZoomJS} true;`
      : 
          content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
          content_mime_type == 'application/vnd.ekstep.html-archive' ||
          content_mime_type == 'application/vnd.ekstep.h5p-archive' ||
          content_mime_type == 'video/x-youtube'
        ? `(function() {
        localStorage.setItem('contentPlayerObject', JSON.stringify(${JSON.stringify(
          {
            contentPlayerConfig: contentPlayerConfig,
          }
        )}));
        window.setData();
        })(); true;`
        : 
          content_mime_type == 'application/pdf'
        ? `(function() {
        localStorage.setItem('contentPlayerObject', JSON.stringify(${JSON.stringify(
          {
            contentPlayerConfig: pdfPlayerConfig,
          }
        )}));
        window.setData();
        })(); true;`
        : 
          content_mime_type == 'video/mp4' ||
          content_mime_type == 'video/webm' ||
          content_mime_type == 'audio/mp3' ||
          content_mime_type == 'audio/wav' ||
          content_mime_type == 'audio/mpeg'
        ? `(function() {
        localStorage.setItem('contentPlayerObject', JSON.stringify(${JSON.stringify(
          {
            contentPlayerConfig: videoPlayerConfig,
          }
        )}));
        window.setData();
        })(); true;`
        : 
          content_mime_type == 'application/epub'
        ? `(function() {
        localStorage.setItem('contentPlayerObject', JSON.stringify(${JSON.stringify(
          {
            contentPlayerConfig: epubPlayerConfig,
          }
        )}));
        window.setData();
        })(); true;`
        : content_mime_type == 'application/pdf'
          ? `(function() {
        window.setData('${JSON.stringify(pdfPlayerConfig)}');
        })(); ${disableZoomJS} true;`
          : content_mime_type == 'video/mp4' ||
              content_mime_type == 'video/webm' ||
              content_mime_type == 'audio/mp3' ||
              content_mime_type == 'audio/wav' ||
              content_mime_type == 'audio/mpeg'
            ? `(function() {
        window.setData('${JSON.stringify(videoPlayerConfig)}');
        })(); true;`
            : content_mime_type == 'application/epub'
              ? `(function() {
        window.setData('${JSON.stringify(epubPlayerConfig)}');
        })(); ${disableZoomJS} true;`
              : ``;

  //event when player closed
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Handle back button press
        console.log('useFocusEffect Back button pressed or screen closed');
        fetchExitData();
        return false; // Return true if you want to block the back action, false to allow it
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        // Cleanup on unmount
        //console.log('useFocusEffect Screen closed');
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );

  const logEvent = async () => {
    const obj = {
      eventName: 'content_exited',
      method: 'button_click',
      screenName: 'Content-Player-exit',
    };

    await logEventFunction(obj);
  };

  const fetchExitData = async () => {
    //store telemetry event
    console.log('called fetch Exit');

    let storedTelemetryObject = await getData('telemetryObject', 'json');
    if (storedTelemetryObject && storedTelemetryObject.length > 0) {
      try {
        let create_telemetry = await telemetryTracking(storedTelemetryObject);
        //console.log('create_telemetry', create_telemetry);
        if (
          create_telemetry &&
          create_telemetry?.response?.responseCode == 'SUCCESS'
        ) {
          console.log('saved data');
        } else {
          console.log('no internet available');
          //store result in offline mode
          const userId = await getDataFromStorage('userId');
          await storeTelemetryOffline(userId, storedTelemetryObject);
        }
      } catch (e) {
        console.log(e);
      }
    }
    //console.log('storedTelemetryObject', JSON.stringify(storedTelemetryObject));
    //store content tracking
    let storedContentEidSTART = await getData(content_do_id+'contentEidSTART', 'json');
    let storedContentEidINTERACT = await getData(content_do_id+'contentEidINTERACT', 'json');
    let storedContentEidEND = await getData(content_do_id+'contentEidEND', 'json');
    let storedContentEidPROGRESS = await getData(content_do_id+'contentEidPROGRESS', 'json');
    console.log('storedContentEidSTART', JSON.stringify(storedContentEidSTART));
    console.log('storedContentEidEND', JSON.stringify(storedContentEidEND));
    console.log('storedContentEidPROGRESS', JSON.stringify(storedContentEidPROGRESS));

    let detailsObject = [];
    try {
      if (storedContentEidSTART && storedContentEidSTART.length > 0) {
        detailsObject.push(storedContentEidSTART[0]);
      } else {
        //for only html content games push end event manually after close app
        if (
          content_mime_type == 'application/vnd.ekstep.html-archive' ||
          content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
          content_mime_type == 'video/x-youtube' ||
          content_mime_type == 'application/vnd.ekstep.h5p-archive'
        ) {
          detailsObject.push({
            eid: 'START',
            edata: {
              duration: 0,
              mode: 'play',
              pageid: 'sunbird-player-Startpage',
              summary: [],
              type: 'content',
            },
          });
        }
      }
    } catch (error) {
      console.log('error', error);
    }
    try {
      if (storedContentEidINTERACT && storedContentEidINTERACT.length > 0) {
        detailsObject.push(storedContentEidINTERACT[0]);
      }
    } catch (error) {
      console.log('error2', error);
    }
    try {
      if (storedContentEidPROGRESS && storedContentEidPROGRESS.length > 0) {
        detailsObject.push(storedContentEidPROGRESS[0]);
      }
    } catch (error) {
      console.log('error2', error);
    }

    try {
      if (storedContentEidEND && storedContentEidEND.length > 0) {
        detailsObject.push(storedContentEidEND[0]);
      } else {
        //for only html content games push end event manually after close app
        if (
          content_mime_type == 'application/vnd.ekstep.html-archive' ||
          content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
          content_mime_type == 'application/vnd.ekstep.h5p-archive'
        ) {
          detailsObject.push({
            eid: 'END',
            edata: {
              duration: 0,
              mode: 'play',
              pageid: 'sunbird-player-Endpage',
              summary: [
                {
                  progress: 100,
                },
                {
                  totallength: '',
                },
                {
                  visitedlength: '',
                },
                {
                  visitedcontentend: '',
                },
                {
                  totalseekedlength: '',
                },
                {
                  endpageseen: false,
                },
              ],
              type: 'content',
            },
          });
        }
      }
    } catch (error) {
      console.log('error', error);
    }

    let userId = await getDataFromStorage('userId');
    let courseId = await getData('courseId', '');
    let unitId = await getData('unitId', '');
    let contentId = await getData('contentId', '');
    let contentType = await getData('contentType', '');
    let contentMime = await getData('contentMimeType', '');
    let lastAccessOn = new Date().toISOString();

    if (detailsObject && detailsObject.length > 0) {
      console.log('reached here', JSON.stringify(detailsObject));

      try {
        await storeTrackingOffline(
          userId,
          courseId,
          contentId,
          contentType,
          contentMime,
          lastAccessOn,
          detailsObject,
          unitId
        );
        /*let create_tracking = await contentTracking(
          userId,
          courseId,
          contentId,
          contentType,
          contentMime,
          lastAccessOn,
          detailsObject,
          unitId
        );
        console.log('create_tracking', create_tracking);
        if (create_tracking && create_tracking?.response?.responseCode == 201) {
          console.log('saved data');
        } else {
          console.log('no internet available');
          //store result in offline mode
          await storeTrackingOffline(
            userId,
            courseId,
            contentId,
            contentType,
            contentMime,
            lastAccessOn,
            detailsObject,
            unitId
          );
        }*/
        logEvent();
      } catch (e) {
        console.log(e);
      }
    }

    await removeData(content_do_id+'contentEidSTART');
    await removeData(content_do_id+'contentEidINTERACT');
    await removeData(content_do_id+'contentEidEND');
    await removeData(content_do_id+'contentEidPROGRESS');
  };
  //event when player closed

  if (loading) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
          hidden={false}
        />
        <View style={styles.container}>
          <View style={styles.middle_screen}>
            <ActivityIndicator size="large" color="#0000ff" />
            {progress > 0 && progress < 100 ? (
              <GlobalText
                style={{ color: '#000000' }}
              >{`Loading: ${progress.toFixed(2)}%`}</GlobalText>
            ) : loading_text != '' ? (
              <GlobalText style={{ color: '#000000' }}>
                {loading_text}
              </GlobalText>
            ) : (
              <></>
            )}
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      {/* Configure status bar for Android 15 compatibility */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
        hidden={false}
      />
      <View style={styles.container}>
        {is_valid_file == false ? (
          <View style={styles.middle_screen}>
            <GlobalText>Invalid Player File</GlobalText>
          </View>
        ) : is_download == true ? (
          <View style={styles.middle_screen}>
            <Button
              title="Download Content"
              onPress={() => {
                if (
                  content_mime_type == 'application/vnd.sunbird.questionset'
                ) {
                  downloadContentQuML();
                } else if (
                  content_mime_type == 'application/vnd.ekstep.ecml-archive' ||
                  content_mime_type == 'video/x-youtube' ||
                  content_mime_type == 'application/vnd.ekstep.html-archive' ||
                  content_mime_type == 'application/vnd.ekstep.h5p-archive'
                ) {
                  downloadContentECMLH5pHTMLYoutube();
                }
              }}
            />
          </View>
        ) : content_mime_type == 'video/x-youtube' && false ? (
          youtubePlayerEndScreen === true ? (
            <View style={styles.middle_screen}>
              <GlobalText style={styles.completionText}>
                You Completed the Video
              </GlobalText>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={() => {
                  Orientation.lockToPortrait();
                  fetchExitData();
                  navigation.goBack();
                }}
                activeOpacity={0.8}
              >
                <GlobalText style={styles.exitButtonText}>
                  Exit Player
                </GlobalText>
              </TouchableOpacity>
            </View>
          ) : (
            (() => {
              // Utility function to extract YouTube video ID from various URL types
              function extractYouTubeVideoId(url) {
                if (!url) return null;
                // Remove surrounding spaces
                url = url.trim();
                // Patterns to match various YouTube share URL formats
                // Return the first match group that's not undefined
                // Examples:
                //  - https://youtu.be/<id>
                //  - https://youtube.com/watch?v=<id>
                //  - https://www.youtube.com/embed/<id>
                //  - https://www.youtube.com/watch?v=<id>&feature=share
                //  - https://m.youtube.com/v/<id>
                //  - https://music.youtube.com/watch?v=<id>
                const patterns = [
                  /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/<id>
                  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // .../embed/<id>
                  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/, // .../v/<id>
                  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // .../shorts/<id>
                  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, // .../watch?v=<id>
                  /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/, // .../watch?...&v=<id>
                  /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/, // ...?[any]&v=<id>
                ];
                for (const pattern of patterns) {
                  const match = url.match(pattern);
                  if (match && match[1]) {
                    return match[1];
                  }
                }
                // If all patterns fail, try generic: get v param out
                try {
                  const urlObj = new URL(url);
                  if (
                    urlObj.hostname.endsWith('youtube.com') ||
                    urlObj.hostname.endsWith('youtu.be')
                  ) {
                    if (urlObj.searchParams.has('v')) {
                      const v = urlObj.searchParams.get('v');
                      // Validate length (YouTube IDs are 11 characters)
                      if (v && v.length === 11) return v;
                    }
                  }
                } catch (e) {
                  // Ignore parse error
                }
                return null;
              }

              const artifactUrl = contentPlayerConfig?.metadata?.artifactUrl;
              const youTubeId = extractYouTubeVideoId(artifactUrl);

              // Calculate available dimensions accounting for safe area padding
              const availableHeight =
                screenData.height - topPadding - bottomPadding;
              const availableWidth =
                windowData.width - landscapeLeftPadding - landscapeRightPadding;

              // YouTube player event handlers
              const handleYouTubeStateChange = async (state) => {
                console.log('YouTube Player State:', state);

                // Track START event when video starts playing
                if (state === 'playing') {
                  console.log('YouTube video started playing');
                  contentEidSTART = [
                    {
                      eid: 'START',
                      edata: {
                        duration: 0,
                        mode: 'play',
                        pageid: 'sunbird-player-Startpage',
                        summary: [],
                        type: 'content',
                      },
                    },
                  ];
                  await storeData(content_do_id+'contentEidSTART', contentEidSTART, 'json');
                }

                // Track END event when video ends
                if (state === 'ended') {
                  console.log('YouTube video ended');
                  contentEidEND = [
                    {
                      eid: 'END',
                      edata: {
                        duration: 0,
                        mode: 'play',
                        pageid: 'sunbird-player-Endpage',
                        summary: [
                          {
                            progress: 100,
                          },
                          {
                            totallength: '',
                          },
                          {
                            visitedlength: '',
                          },
                          {
                            visitedcontentend: '',
                          },
                          {
                            totalseekedlength: '',
                          },
                          {
                            endpageseen: false,
                          },
                        ],
                        type: 'content',
                      },
                    },
                  ];
                  await storeData(content_do_id+'contentEidEND', contentEidEND, 'json');
                  // Optionally navigate back or handle video end

                  // Exit fullscreen when video ends
                  Orientation.lockToPortrait();
                  setYoutubePlayerEndScreen(true);

                  // Add a small delay to ensure fullscreen exits before navigation
                  setTimeout(() => {
                    // Lock to portrait and navigate back
                    // Orientation.lockToPortrait();
                    // fetchExitData();
                    // navigation.goBack();
                  }, 500);
                }
              };

              const handleYouTubeReady = () => {
                console.log('YouTube player is ready');
              };

              const handleYouTubeError = (error) => {
                console.log('YouTube player error:', error);
              };

              return (
                <View
                  style={{
                    width: availableWidth,
                    height: availableHeight,
                    overflow: 'hidden',
                  }}
                >
                  <YoutubePlayer
                    height={availableHeight}
                    width={availableWidth}
                    play={true}
                    videoId={youTubeId}
                    onChangeState={handleYouTubeStateChange}
                    onReady={handleYouTubeReady}
                    onError={handleYouTubeError}
                    webViewProps={{
                      scrollEnabled: false,
                      showsVerticalScrollIndicator: false,
                      showsHorizontalScrollIndicator: false,
                      bounces: false,
                      injectedJavaScript: `
                      document.body.style.overflow = 'hidden';
                      document.documentElement.style.overflow = 'hidden';
                      const player = document.querySelector('iframe');
                      if (player) {
                        player.style.position = 'absolute';
                        player.style.top = '0';
                        player.style.left = '0';
                        player.style.width = '100%';
                        player.style.height = '100vh';
                      }
                      true;
                    `,
                      style: {
                        backgroundColor: 'black',
                      },
                    }}
                    initialPlayerParams={{
                      modestbranding: 1,
                      rel: 0,
                      controls: 1,
                      playsinline: 1,
                    }}
                  />
                </View>
              );
            })()
          )
        ) :
          content_mime_type == 'application/vnd.ekstep.html-archive' ||
          content_mime_type == 'application/vnd.ekstep.h5p-archive' ||
          content_mime_type == 'video/x-youtube' ||
          content_mime_type == 'application/pdf' ||
          content_mime_type == 'video/mp4' ||
          content_mime_type == 'video/webm' ||
          content_mime_type == 'audio/mp3' ||
          content_mime_type == 'audio/wav' ||
          content_mime_type == 'audio/mpeg' ||
          content_mime_type == 'application/epub'
        ? (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={
              {uri: `${urlLocal}/content-player-${Config.CONTENT_PLAYER_VERSION}/index_android.html`}
            }
            style={styles.webview}
            userAgent={
              content_mime_type == 'video/x-youtube'
                ? undefined
                : lib_folder == 'sunbird-content-player'
                  ? desktopUserAgent
                  : undefined
            }
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            startInLoadingState={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowingReadAccessToURL={true}
            mixedContentMode={'always'}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            allowsInlineMediaPlayback={true}
            /*
            //for rtl
            style={[
              styles.webview,
              isRTL && { transform: [{ scaleX: -1 }] }, // Apply transform for RTL only
            ]}
            contentStyle={{ direction: isRTL ? 'rtl' : 'ltr' }} // Sets text direction inside WebView
            */
            allowFileAccessFromFileURLs={true}
          />
        )
        : (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={
              Platform.OS === 'ios' ? htmlFilePath : { uri: htmlFilePath }
            }
            style={styles.webview}
            userAgent={
              content_mime_type == 'video/x-youtube'
                ? undefined
                : lib_folder == 'sunbird-content-player'
                  ? desktopUserAgent
                  : undefined
            }
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            startInLoadingState={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowingReadAccessToURL={true}
            mixedContentMode={'always'}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            allowsInlineMediaPlayback={true}
            /*
            //for rtl
            style={[
              styles.webview,
              isRTL && { transform: [{ scaleX: -1 }] }, // Apply transform for RTL only
            ]}
            contentStyle={{ direction: isRTL ? 'rtl' : 'ltr' }} // Sets text direction inside WebView
            */
            allowFileAccessFromFileURLs={true}
          />
        )}
        <TestResultModal modal={modal} title={title} isRegistrationTest={isRegistrationTest} />
        {alertModal && <MimeAlertModal textTitle={errorDetail} />}
      </View>
    </>
  );
};

export default StandAlonePlayer;
