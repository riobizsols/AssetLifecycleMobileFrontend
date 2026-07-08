/**
 * Go back when the stack allows it; otherwise return to Home (e.g. module opened from side menu).
 */
export function goBackOrHome(navigation) {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('Home');
}
