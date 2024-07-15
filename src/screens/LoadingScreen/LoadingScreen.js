import { View, Image, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import Logo from '../../assets/images/png/logo-with-tagline.png';
import { Spinner } from '@ui-kitten/components';
const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LanguageScreen');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          width: '100%',
        }}
      >
        <Image style={styles.image} source={Logo} resizeMode="contain" />
        <Spinner size="large" style={{ borderColor: '#635E57' }} />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  image: {
    marginBottom: 20,
    height: 100,
    width: '100%',
  },
});
export default LoadingScreen;
