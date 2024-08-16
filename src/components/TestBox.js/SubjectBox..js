import React from 'react';
import PropTypes from 'prop-types';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import SecondaryButton from '../SecondaryButton/SecondaryButton';
import {
  capitalizeFirstLetter,
  convertSecondsToMinutes,
} from '../../utils/JsHelper/Helper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import globalStyles from '../../utils/Helper/Style';

const SubjectBox = ({ name, disabled, data }) => {
  // console.log({ data });
  const { t } = useTranslation();
  const navigation = useNavigation();
  const time = convertSecondsToMinutes(JSON.parse(data?.timeLimits)?.maxTime);
  // const IL_UNIQUE_ID = data?.IL_UNIQUE_ID;
  // console.log('time', IL_UNIQUE_ID);

  const handlePress = () => {
    navigation.navigate('AnswerKeyView', {
      title: name,
      contentId: data?.IL_UNIQUE_ID,
    });
  };

  return (
    <SafeAreaView>
      <TouchableOpacity disabled={disabled} onPress={handlePress}>
        <View style={styles.card}>
          <View style={styles.rightContainer}>
            <Text style={globalStyles.subHeading}>
              {t(capitalizeFirstLetter(name))}
            </Text>
            {disabled ? (
              <Text style={[globalStyles.subHeading, { color: '#7C766F' }]}>
                {t('not_started')}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#000' }}>
                  {data?.totalScore}/{data?.totalMaxScore}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 20,
                  }}
                >
                  <Icon name="circle" size={8} color="#7C766F" />
                  <Text
                    style={[
                      globalStyles.subHeading,
                      { color: '#7C766F', marginLeft: 5 },
                    ]}
                  >
                    {moment(data?.lastAttemptedOn).format('DD MMM, YYYY')}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ marginRight: 10, paddingVertical: 10 }}>
            {!data?.lastAttemptedOn ? (
              <MaterialIcons name="navigate-next" size={32} color="black" />
            ) : (
              <SecondaryButton
                onPress={() => {
                  navigation.navigate('TestDetailView', {
                    title: name,
                    data: data,
                  });
                }}
                style={globalStyles.text}
                text={'take_the_test'}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

SubjectBox.propTypes = {
  name: PropTypes.string,
  data: PropTypes.any,
  disabled: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D0C5B4',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'white',
    padding: 5,
  },

  rightContainer: {
    flex: 4,
    marginLeft: 10,
    // borderWidth: 1,
  },

  smileyText: {
    fontSize: 16,
    marginLeft: 5,
  },
  rightArrow: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 20,
  },
});

export default SubjectBox;
