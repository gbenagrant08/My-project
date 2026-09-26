import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENTS, type AccentKey } from '../lib/theme';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { getMovie } from '../lib/data/selectors';
import { formatHours } from '../lib/format';
import { Screen } from '../components/Screen';
import { RoundIconButton } from '../components/Buttons';
import { ScalePressable } from '../components/ScalePressable';
import { success, tap, thump } from '../lib/haptics';

const EAS_COMMANDS = [
  { label: 'Install the EAS CLI', code: 'npm install -g eas-cli' },
  { label: 'Sign in to your Expo account', code: 'eas login' },
  { label: 'Link the project (writes eas.json)', code: 'eas build:configure' },
  { label: 'Build an APK for your phone', code: 'eas build -p android --profile preview' },
  { label: 'Build an AAB for the Play Store', code: 'eas build -p android --profile production' },
];

const PLAY_CHECKLIST = [
  'Open play.google.com/console and create an app named "Gbena grant".',
  'Upload the .aab produced by the production profile.',
  'Add the 512x512 icon (assets/store-icon-512.png) and the 1024x500 feature graphic.',
  'Attach at least two phone screenshots plus a short and full description.',
  'Complete the content rating questionnaire and the data safety form.',
  'Set the target audience, then send the release to internal testing.',
];

export function ProfileScreen() {
  const { colors, fonts, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const store = useAppStore();
  const [shipOpen, setShipOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const stats = useMemo(() => {
    const watchedMovies = store.watched
      .map((id) => getMovie(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    const minutes = watchedMovies.reduce((sum, m) => sum + m.runtime, 0);
    return [
      { key: 'list', label: 'My list', value: String(store.watchlist.length), icon: 'bookmark' as const },
      { key: 'liked', label: 'Liked', value: String(store.liked.length), icon: 'heart' as const },
      { key: 'watched', label: 'Watched', value: String(store.watched.length), icon: 'eye' as const },
      { key: 'hours', label: 'Screen time', value: formatHours(minutes), icon: 'time' as const },
    ];
  }, [store.watchlist.length, store.liked.length, store.watched.length]);

  const downloadCount = Object.values(store.downloads).filter((p) => p >= 100).length;

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(text);
    success();
    setTimeout(() => setCopied((c) => (c === text ? null : c)), 1600);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* identity */}
        <View style={styles.identity}>
          <View
            style={{
              width: 78,
              height: 78,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentDim,
              borderWidth: 2,
              borderColor: colors.accentLine,
            }}
          >
            <Text style={{ color: colors.accent, fontFamily: fonts.displayBlack, fontSize: 28 }}>GG</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 23 }}>Gbena Grant</Text>
            <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12.5, marginTop: 3 }}>
              {'@gbenagrant  \u00b7  Premium member'}
            </Text>
            <View style={styles.pillRow}>
              <View style={[styles.miniPill, { backgroundColor: colors.accentDim, borderColor: colors.accentLine }]}>
                <Ionicons name="sparkles" size={11} color={colors.accent} />
                <Text style={{ color: colors.accent, fontFamily: fonts.semi, fontSize: 10.5 }}>AD-FREE</Text>
              </View>
              <View style={[styles.miniPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="logo-android" size={11} color={colors.textDim} />
                <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 10.5 }}>ANDROID</Text>
              </View>
            </View>
          </View>
          <RoundIconButton icon="create-outline" variant="solid" onPress={() => tap()} accessibilityLabel="Edit profile" />
        </View>

        {/* stats */}
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View
              key={s.key}
              style={[
                styles.statTile,
                { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.md },
              ]}
            >
              <Ionicons name={s.icon} size={15} color={colors.accent} />
              <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fonts.black, fontSize: 18, marginTop: 6 }}>
                {s.value}
              </Text>
              <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 10.5, marginTop: 2 }}>
                {s.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* accent */}
        <SectionTitle text="APPEARANCE" />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg }]}
        >
          <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 12.5, marginBottom: 13 }}>
            {`Accent colour  \u00b7  ${ACCENTS.find((a) => a.key === store.accent)?.label ?? 'Premier Gold'}`}
          </Text>
          <View style={styles.swatches}>
            {ACCENTS.map((a) => {
              const active = store.accent === a.key;
              return (
                <ScalePressable
                  key={a.key}
                  scaleTo={0.9}
                  onPress={() => {
                    thump();
                    store.setAccent(a.key as AccentKey);
                  }}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: a.hex,
                      borderColor: active ? colors.text : 'transparent',
                    },
                  ]}
                  accessibilityLabel={a.label}
                >
                  {active ? <Ionicons name="checkmark" size={17} color={a.onAccent} /> : null}
                </ScalePressable>
              );
            })}
          </View>
        </View>

        {/* preferences */}
        <SectionTitle text="PREFERENCES" />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg, paddingVertical: 4 }]}
        >
          <ToggleRow
            icon="notifications-outline"
            label="New release alerts"
            hint="Push a note when a title lands"
            value={store.notifications}
            onChange={(v) => store.setFlag('notifications', v)}
          />
          <ToggleRow
            icon="play-circle-outline"
            label="Autoplay previews"
            hint="Rotate the home carousel automatically"
            value={store.autoplayPreviews}
            onChange={(v) => store.setFlag('autoplayPreviews', v)}
          />
          <ToggleRow
            icon="eye-off-outline"
            label="Mature content"
            hint="Show 18+ titles in results"
            value={store.matureContent}
            onChange={(v) => store.setFlag('matureContent', v)}
            last
          />
        </View>

        {/* library shortcuts */}
        <SectionTitle text="LIBRARY" />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg, paddingVertical: 4 }]}
        >
          <LinkRow
            icon="cloud-download-outline"
            label="Downloads"
            hint={`${downloadCount} title${downloadCount === 1 ? '' : 's'} ready offline`}
            onPress={() => navigation.navigate('Downloads')}
          />
          <LinkRow
            icon="bookmark-outline"
            label="My list"
            hint={`${store.watchlist.length} saved`}
            onPress={() => navigation.navigate('Tabs', { screen: 'Library' } as never)}
          />
          <LinkRow
            icon="heart-outline"
            label="Liked titles"
            hint={`${store.liked.length} favourites`}
            onPress={() => navigation.navigate('Tabs', { screen: 'Library' } as never)}
            last
          />
        </View>

        {/* ship it */}
        <SectionTitle text="SHIP IT" />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg, paddingVertical: 4 }]}
        >
          <LinkRow
            icon="terminal-outline"
            label="Build & release"
            hint="EAS commands and the Play Store checklist"
            onPress={() => {
              tap();
              setShipOpen(true);
            }}
          />
          <LinkRow
            icon="information-circle-outline"
            label="About this app"
            hint={'com.gbenagrant.movieapp  \u00b7  v1.0.0'}
            onPress={() => {
              tap();
              setAboutOpen(true);
            }}
            last
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <ScalePressable
            scaleTo={0.97}
            onPress={() => {
              thump();
              setConfirmReset(true);
            }}
            style={[
              styles.resetBtn,
              { borderColor: colors.danger, borderRadius: radius.md },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontFamily: fonts.semi, fontSize: 13.5 }}>
              Reset all local data
            </Text>
          </ScalePressable>
          <Text
            style={{
              color: colors.textFaint,
              fontFamily: fonts.regular,
              fontSize: 11.5,
              textAlign: 'center',
              marginTop: 18,
              lineHeight: 17,
            }}
          >
            {'Gbena Grant v1.0.0  \u00b7  Expo SDK 57\nBuilt with React Native, ships to Android, iOS and the web.'}
          </Text>
        </View>
      </ScrollView>

      {/* ---------------- ship modal ---------------- */}
      <Modal visible={shipOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShipOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShipOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.elevated, borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
            onPress={() => undefined}
          >
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 30 }}>
              <View style={styles.sheetHead}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accentDim,
                  }}
                >
                  <Ionicons name="rocket-outline" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 21 }}>Build & release</Text>
                  <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 }}>
                    Everything you need to ship this app to Android
                  </Text>
                </View>
                <RoundIconButton icon="close" variant="solid" onPress={() => setShipOpen(false)} accessibilityLabel="Close" />
              </View>

              <SheetLabel text={'1  \u00b7  EAS BUILD COMMANDS'} />
              {EAS_COMMANDS.map((c) => (
                <View
                  key={c.code}
                  style={[styles.codeRow, { backgroundColor: colors.bgDeep, borderColor: colors.borderSoft, borderRadius: radius.sm }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 11.5, marginBottom: 5 }}>
                      {c.label}
                    </Text>
                    <Text selectable style={{ color: colors.accentSoft, fontFamily: fonts.techMedium, fontSize: 12.5 }}>
                      {c.code}
                    </Text>
                  </View>
                  <ScalePressable
                    scaleTo={0.88}
                    onPress={() => copy(c.code)}
                    style={{ padding: 7, marginLeft: 8 }}
                    accessibilityLabel="Copy command"
                  >
                    <Ionicons
                      name={copied === c.code ? 'checkmark-circle' : 'copy-outline'}
                      size={17}
                      color={copied === c.code ? colors.success : colors.textFaint}
                    />
                  </ScalePressable>
                </View>
              ))}

              <SheetLabel text={'2  \u00b7  PLAY STORE CHECKLIST'} />
              {PLAY_CHECKLIST.map((item, i) => (
                <View key={item} style={styles.checkRow}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accentDim,
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: 10 }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: colors.textDim, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 }}>
                    {item}
                  </Text>
                </View>
              ))}

              <SheetLabel text={'3  \u00b7  PROJECT CONFIG'} />
              <View style={[styles.codeRow, { backgroundColor: colors.bgDeep, borderColor: colors.borderSoft, borderRadius: radius.sm }]}>
                <View style={{ flex: 1, gap: 6 }}>
                  <ConfigLine k="App name" v="Gbena grant" />
                  <ConfigLine k="Slug" v="gbena-grant" />
                  <ConfigLine k="Android package" v="com.gbenagrant.movieapp" />
                  <ConfigLine k="versionCode" v="1" />
                  <ConfigLine k="preview profile" v={'internal distribution \u00b7 apk'} />
                  <ConfigLine k="production profile" v={'aab \u00b7 Play Store upload'} />
                </View>
              </View>

              <ScalePressable
                scaleTo={0.97}
                onPress={() => copy(EAS_COMMANDS.map((c) => c.code).join('\n'))}
                style={[styles.copyAll, { backgroundColor: colors.accent, borderRadius: radius.pill }]}
              >
                <Ionicons name="copy-outline" size={16} color={colors.accentText} />
                <Text style={{ color: colors.accentText, fontFamily: fonts.bold, fontSize: 14 }}>
                  {copied && copied.includes('\n') ? 'All commands copied' : 'Copy all commands'}
                </Text>
              </ScalePressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------------- about modal ---------------- */}
      <Modal visible={aboutOpen} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setAboutOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAboutOpen(false)}>
          <View
            style={[styles.dialog, { backgroundColor: colors.elevated, borderColor: colors.border, borderRadius: radius.xl }]}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: colors.accentText, fontFamily: fonts.tech, fontSize: 26 }}>G</Text>
            </View>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 22 }}>Gbena grant</Text>
            <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12.5, marginTop: 5, textAlign: 'center', lineHeight: 19 }}>
              {'A dark, cinematic catalogue of 50 hand-picked films \u2014 from Hollywood classics to Nollywood originals.\n\nVersion 1.0.0  \u00b7  com.gbenagrant.movieapp'}
            </Text>
            <ScalePressable
              scaleTo={0.96}
              onPress={() => setAboutOpen(false)}
              style={[styles.dialogBtn, { backgroundColor: colors.accent, borderRadius: radius.pill }]}
            >
              <Text style={{ color: colors.accentText, fontFamily: fonts.bold, fontSize: 14 }}>Close</Text>
            </ScalePressable>
          </View>
        </Pressable>
      </Modal>

      {/* ---------------- reset confirm ---------------- */}
      <Modal visible={confirmReset} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setConfirmReset(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmReset(false)}>
          <View
            style={[styles.dialog, { backgroundColor: colors.elevated, borderColor: colors.border, borderRadius: radius.xl }]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,90,106,0.14)',
                marginBottom: 12,
              }}
            >
              <Ionicons name="warning-outline" size={24} color={colors.danger} />
            </View>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 20, textAlign: 'center' }}>
              Reset everything?
            </Text>
            <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>
              Your list, likes, watch history, downloads and search history will be cleared from this device.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <ScalePressable
                scaleTo={0.96}
                onPress={() => setConfirmReset(false)}
                style={[styles.dialogBtn, { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}
              >
                <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14 }}>Keep data</Text>
              </ScalePressable>
              <ScalePressable
                scaleTo={0.96}
                onPress={() => {
                  store.resetAll();
                  setConfirmReset(false);
                  thump();
                }}
                style={[styles.dialogBtn, { flex: 1, backgroundColor: colors.danger, borderRadius: radius.pill }]}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 14 }}>Reset</Text>
              </ScalePressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function SectionTitle({ text }: { text: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text style={{ color: colors.textFaint, fontFamily: fonts.semi, fontSize: 10.5, letterSpacing: 1.9, paddingHorizontal: 20, marginTop: 26, marginBottom: 11 }}>
      {text}
    </Text>
  );
}

function SheetLabel({ text }: { text: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text style={{ color: colors.textFaint, fontFamily: fonts.semi, fontSize: 10.5, letterSpacing: 1.7, marginTop: 22, marginBottom: 10 }}>
      {text}
    </Text>
  );
}

function ConfigLine({ k, v }: { k: string; v: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 12 }}>{k}</Text>
      <Text style={{ color: colors.text, fontFamily: fonts.techMedium, fontSize: 12, flexShrink: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        styles.rowBase,
        !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft } : null,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textDim} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 11.5, marginTop: 2 }}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          tap();
          onChange(v);
        }}
        trackColor={{ false: colors.surfaceAlt, true: colors.accentLine }}
        thumbColor={value ? colors.accent : colors.textFaint}
        ios_backgroundColor={colors.surfaceAlt}
      />
    </View>
  );
}

function LinkRow({
  icon,
  label,
  hint,
  onPress,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowBase,
        { opacity: pressed ? 0.6 : 1 },
        !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft } : null,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textDim} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 11.5, marginTop: 2 }}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
  },
  pillRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  card: { marginHorizontal: 20, padding: 16, borderWidth: 1 },
  swatches: { flexDirection: 'row', gap: 12 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  rowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 14,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,4,8,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: { maxHeight: '86%', paddingBottom: 8 },
  grabber: { width: 42, height: 4, borderRadius: 999, alignSelf: 'center', marginTop: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 16 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 13,
    marginBottom: 9,
  },
  checkRow: { flexDirection: 'row', gap: 11, marginBottom: 12 },
  copyAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
    marginTop: 22,
  },
  dialog: {
    margin: 26,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  dialogBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 20 },
});
