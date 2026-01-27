import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Shield, Database, Server, Globe, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PermissionGate } from '@/components/PermissionGate';
import { Language } from '@/i18n/translations';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { t, language, setLanguage, languages, isRTL } = useLanguage();

  const handleLanguageSelect = async (lang: Language) => {
    console.log('[Settings] Language selected:', lang);
    await setLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t('settings.languageSettings')}
          </Text>
          
          <View style={styles.languageList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.7}
              >
                <View style={[styles.languageContent, isRTL && styles.rowRTL]}>
                  <View style={styles.languageIcon}>
                    <Globe size={20} color={language === lang.code ? '#fff' : '#666'} />
                  </View>
                  <Text style={[
                    styles.languageName,
                    language === lang.code && styles.languageNameActive,
                  ]}>
                    {lang.name}
                  </Text>
                </View>
                {language === lang.code && (
                  <View style={styles.checkIcon}>
                    <Check size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PermissionGate
          roles={['developer']}
          showFallback
          fallback={
            <View style={styles.accessDenied}>
              <Shield size={48} color="#ccc" />
              <Text style={[styles.accessDeniedTitle, isRTL && styles.textRTL]}>
                {t('settings.accessRestricted')}
              </Text>
              <Text style={[styles.accessDeniedText, isRTL && styles.textRTL]}>
                {t('settings.onlyDevelopers')}
              </Text>
            </View>
          }
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Settings size={24} color="#000" />
            </View>
            <Text style={[styles.title, isRTL && styles.textRTL]}>
              {t('settings.systemSettings')}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
              {t('settings.configureSystem')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('settings.databaseConnection')}
            </Text>
            
            <View style={[styles.configCard, isRTL && styles.rowRTL]}>
              <View style={styles.configIcon}>
                <Database size={20} color="#000" />
              </View>
              <View style={[styles.configContent, isRTL && styles.configContentRTL]}>
                <Text style={[styles.configTitle, isRTL && styles.textRTL]}>
                  {t('settings.externalDatabase')}
                </Text>
                <Text style={[styles.configStatus, isRTL && styles.textRTL]}>
                  {t('settings.notConnected')}
                </Text>
              </View>
            </View>

            <View style={[styles.configCard, isRTL && styles.rowRTL]}>
              <View style={styles.configIcon}>
                <Server size={20} color="#000" />
              </View>
              <View style={[styles.configContent, isRTL && styles.configContentRTL]}>
                <Text style={[styles.configTitle, isRTL && styles.textRTL]}>
                  {t('settings.apiEndpoint')}
                </Text>
                <Text style={[styles.configStatus, isRTL && styles.textRTL]}>
                  {t('settings.notConfigured')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>
              {t('settings.configurationRequired')}
            </Text>
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {t('settings.configurationInfo')}
            </Text>
            <View style={styles.providerList}>
              <Text style={[styles.providerItem, isRTL && styles.textRTL]}>
                {isRTL ? 'Firebase / Firestore •' : '• Firebase / Firestore'}
              </Text>
              <Text style={[styles.providerItem, isRTL && styles.textRTL]}>
                {isRTL ? 'Supabase •' : '• Supabase'}
              </Text>
              <Text style={[styles.providerItem, isRTL && styles.textRTL]}>
                {isRTL ? 'Custom REST API •' : '• Custom REST API'}
              </Text>
            </View>
          </View>
        </PermissionGate>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  languageList: {
    gap: 10,
  },
  languageOption: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  languageContent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  languageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#000',
  },
  languageNameActive: {
    color: '#fff',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  configIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  configContent: {
    marginLeft: 14,
    flex: 1,
  },
  configContentRTL: {
    marginLeft: 0,
    marginRight: 14,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000',
    marginBottom: 2,
  },
  configStatus: {
    fontSize: 13,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  providerList: {
    gap: 8,
  },
  providerItem: {
    fontSize: 14,
    color: '#444',
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
