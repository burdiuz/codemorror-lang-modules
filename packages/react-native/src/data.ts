// Curated completion data. Only `react` and `react-native` are baked in here
// since every React Native project has them; anything else (expo-image,
// react-native-safe-area-context, @shopify/react-native-skia, ...) is
// supplied by the consumer via ReactNativeCompletionConfig.modules and merged
// on top of these built-ins (see completion.ts's mergeModules).
//
// This is a hand-curated subset, not derived from the packages' own .d.ts
// files — JSX prop types involve unions/generics/extends chains that aren't
// worth fully modeling for editor completion, and CodeMirror can't validate
// TypeScript anyway, so a maintained list of the props people actually reach
// for carries the value at a fraction of the fragility.

export type EntryType = "function" | "type" | "variable"

export interface ModuleExportEntry {
  type: EntryType
  detail?: string
  props?: string[]
}

export type ModuleExports = Record<string, ModuleExportEntry>
export type ModuleRegistry = Record<string, ModuleExports>

const COMMON_VIEW_PROPS = [
  "style",
  "children",
  "testID",
  "pointerEvents",
  "onLayout",
  "accessible",
  "accessibilityLabel",
  "accessibilityRole",
  "hitSlop",
]

const react: ModuleExports = {
  useState: {type: "function", detail: "useState(initialState)"},
  useEffect: {type: "function", detail: "useEffect(setup, deps?)"},
  useLayoutEffect: {type: "function", detail: "useLayoutEffect(setup, deps?)"},
  useMemo: {type: "function", detail: "useMemo(factory, deps)"},
  useCallback: {type: "function", detail: "useCallback(fn, deps)"},
  useRef: {type: "function", detail: "useRef(initialValue)"},
  useContext: {type: "function", detail: "useContext(Context)"},
  useReducer: {type: "function", detail: "useReducer(reducer, initialState)"},
  useId: {type: "function", detail: "useId()"},
  useTransition: {type: "function", detail: "useTransition()"},
  useDeferredValue: {type: "function", detail: "useDeferredValue(value)"},
  useImperativeHandle: {type: "function", detail: "useImperativeHandle(ref, createHandle, deps?)"},
  createContext: {type: "function", detail: "createContext(defaultValue)"},
  memo: {type: "function", detail: "memo(Component)"},
  forwardRef: {type: "function", detail: "forwardRef(render)"},
  Fragment: {type: "type"},
  StrictMode: {type: "type"},
}

const reactNative: ModuleExports = {
  View: {type: "type", props: [...COMMON_VIEW_PROPS]},
  Text: {type: "type", props: ["style", "children", "numberOfLines", "ellipsizeMode", "onPress", "selectable", "testID"]},
  ScrollView: {
    type: "type",
    props: [
      ...COMMON_VIEW_PROPS,
      "contentContainerStyle",
      "horizontal",
      "showsVerticalScrollIndicator",
      "showsHorizontalScrollIndicator",
      "onScroll",
      "scrollEventThrottle",
      "refreshControl",
      "keyboardShouldPersistTaps",
    ],
  },
  FlatList: {
    type: "type",
    props: [
      "data",
      "renderItem",
      "keyExtractor",
      "style",
      "contentContainerStyle",
      "horizontal",
      "numColumns",
      "onEndReached",
      "onEndReachedThreshold",
      "ListHeaderComponent",
      "ListFooterComponent",
      "ListEmptyComponent",
      "ItemSeparatorComponent",
      "refreshing",
      "onRefresh",
      "getItemLayout",
    ],
  },
  SectionList: {
    type: "type",
    props: ["sections", "renderItem", "renderSectionHeader", "keyExtractor", "style", "stickySectionHeadersEnabled"],
  },
  Image: {type: "type", props: ["source", "style", "resizeMode", "onLoad", "onError", "defaultSource", "blurRadius"]},
  ImageBackground: {type: "type", props: ["source", "style", "imageStyle", "resizeMode", "children"]},
  Pressable: {
    type: "type",
    props: ["onPress", "onLongPress", "onPressIn", "onPressOut", "style", "disabled", "hitSlop", "android_ripple", "children"],
  },
  TouchableOpacity: {type: "type", props: ["onPress", "onLongPress", "style", "activeOpacity", "disabled", "hitSlop", "children"]},
  TouchableHighlight: {type: "type", props: ["onPress", "onLongPress", "style", "underlayColor", "disabled", "children"]},
  TouchableWithoutFeedback: {type: "type", props: ["onPress", "onLongPress", "children"]},
  TextInput: {
    type: "type",
    props: [
      "value",
      "defaultValue",
      "onChangeText",
      "onSubmitEditing",
      "onFocus",
      "onBlur",
      "placeholder",
      "placeholderTextColor",
      "style",
      "secureTextEntry",
      "keyboardType",
      "autoCapitalize",
      "autoCorrect",
      "multiline",
      "numberOfLines",
      "editable",
      "maxLength",
    ],
  },
  Switch: {type: "type", props: ["value", "onValueChange", "disabled", "trackColor", "thumbColor", "style"]},
  Button: {type: "type", props: ["title", "onPress", "color", "disabled", "accessibilityLabel"]},
  ActivityIndicator: {type: "type", props: ["animating", "color", "size", "style", "hidesWhenStopped"]},
  Modal: {type: "type", props: ["visible", "animationType", "transparent", "onRequestClose", "presentationStyle", "children"]},
  SafeAreaView: {type: "type", props: [...COMMON_VIEW_PROPS]},
  KeyboardAvoidingView: {type: "type", props: [...COMMON_VIEW_PROPS, "behavior", "keyboardVerticalOffset", "enabled"]},
  StatusBar: {type: "type", props: ["barStyle", "backgroundColor", "hidden", "translucent", "animated"]},
  Animated: {type: "variable"},
  StyleSheet: {type: "variable", detail: "StyleSheet.create({...})"},
  Dimensions: {type: "variable", detail: 'Dimensions.get("window")'},
  Platform: {type: "variable", detail: "Platform.OS / Platform.select({...})"},
  Alert: {type: "variable", detail: "Alert.alert(title, message)"},
  Keyboard: {type: "variable"},
  Linking: {type: "variable"},
  Vibration: {type: "variable"},
  PanResponder: {type: "variable", detail: "PanResponder.create({...})"},
  LayoutAnimation: {type: "variable"},
  useColorScheme: {type: "function", detail: "useColorScheme()"},
  useWindowDimensions: {type: "function", detail: "useWindowDimensions()"},
}

export const BUILTIN_MODULES: ModuleRegistry = {
  react,
  "react-native": reactNative,
}

// RN StyleSheet property names → curated enum values (undefined means the
// value is free-form — a color, number, or dimension — and isn't worth a
// suggestion list). Deliberately not split by View/Text/Image since a JSX
// element's own component type isn't cross-referenced when completing inside
// its style object — a handful of Text-only properties showing up for a View
// style dict is an acceptable false positive for the simplicity it buys.
export const STYLE_PROPERTIES: Record<string, string[] | undefined> = {
  // Flexbox / layout
  alignContent: ["flex-start", "flex-end", "center", "stretch", "space-between", "space-around"],
  alignItems: ["flex-start", "flex-end", "center", "stretch", "baseline"],
  alignSelf: ["auto", "flex-start", "flex-end", "center", "stretch", "baseline"],
  aspectRatio: undefined,
  borderBottomWidth: undefined,
  borderEndWidth: undefined,
  borderLeftWidth: undefined,
  borderRightWidth: undefined,
  borderStartWidth: undefined,
  borderTopWidth: undefined,
  borderWidth: undefined,
  bottom: undefined,
  columnGap: undefined,
  direction: ["inherit", "ltr", "rtl"],
  display: ["flex", "none"],
  end: undefined,
  flex: undefined,
  flexBasis: undefined,
  flexDirection: ["row", "row-reverse", "column", "column-reverse"],
  flexGrow: undefined,
  flexShrink: undefined,
  flexWrap: ["wrap", "nowrap", "wrap-reverse"],
  gap: undefined,
  height: undefined,
  justifyContent: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
  left: undefined,
  margin: undefined,
  marginBottom: undefined,
  marginEnd: undefined,
  marginHorizontal: undefined,
  marginLeft: undefined,
  marginRight: undefined,
  marginStart: undefined,
  marginTop: undefined,
  marginVertical: undefined,
  maxHeight: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  minWidth: undefined,
  overflow: ["visible", "hidden", "scroll"],
  padding: undefined,
  paddingBottom: undefined,
  paddingEnd: undefined,
  paddingHorizontal: undefined,
  paddingLeft: undefined,
  paddingRight: undefined,
  paddingStart: undefined,
  paddingTop: undefined,
  paddingVertical: undefined,
  position: ["absolute", "relative", "static"],
  right: undefined,
  rowGap: undefined,
  start: undefined,
  top: undefined,
  width: undefined,
  zIndex: undefined,

  // Border / background / shadow
  backgroundColor: undefined,
  borderColor: undefined,
  borderTopColor: undefined,
  borderBottomColor: undefined,
  borderLeftColor: undefined,
  borderRightColor: undefined,
  borderRadius: undefined,
  borderTopLeftRadius: undefined,
  borderTopRightRadius: undefined,
  borderBottomLeftRadius: undefined,
  borderBottomRightRadius: undefined,
  borderStyle: ["solid", "dotted", "dashed"],
  opacity: undefined,
  elevation: undefined,
  shadowColor: undefined,
  shadowOffset: undefined,
  shadowOpacity: undefined,
  shadowRadius: undefined,
  transform: undefined,

  // Text
  color: undefined,
  fontFamily: undefined,
  fontSize: undefined,
  fontStyle: ["normal", "italic"],
  fontWeight: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
  letterSpacing: undefined,
  lineHeight: undefined,
  textAlign: ["auto", "left", "right", "center", "justify"],
  textAlignVertical: ["auto", "top", "bottom", "center"],
  textDecorationLine: ["none", "underline", "line-through", "underline line-through"],
  textDecorationColor: undefined,
  textDecorationStyle: ["solid", "double", "dotted", "dashed"],
  textShadowColor: undefined,
  textShadowOffset: undefined,
  textShadowRadius: undefined,
  textTransform: ["none", "uppercase", "lowercase", "capitalize"],
  writingDirection: ["auto", "ltr", "rtl"],

  // Image
  resizeMode: ["cover", "contain", "stretch", "repeat", "center"],
  overlayColor: undefined,
  tintColor: undefined,
}
