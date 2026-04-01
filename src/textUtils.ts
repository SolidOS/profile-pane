function strToUpperCase(str) {
  if (str && str[0] > '') {
    const strCase = str.split(' ')
    for (let i = 0; i < strCase.length; i++) {
      strCase[i] = strCase[i].charAt(0).toUpperCase() +
        strCase[i].substring(1)
    }
    return strCase.join(' ')
  }
  return ''
}

export { strToUpperCase }
