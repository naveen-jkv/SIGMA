import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SHADOWS } from '../src/constants/theme';
import Header from '../src/components/Header';
import { createCase, savePendingCase } from '../src/services/api';

const SYMPTOM_OPTIONS = [
  'Watery Diarrhea',
  'Vomiting',
  'Severe Dehydration',
  'Abdominal Cramps',
  'Fever',
  'Nausea & Weakness',
  'Bloody Stool',
];

const SEVERITY_LEVELS = [
  { id: 'MILD', label: 'Mild', desc: 'Manageable, minimal dehydration' },
  { id: 'MODERATE', label: 'Moderate', desc: 'Frequent episodes, mild fever' },
  { id: 'CRITICAL', label: 'Severe / Critical', desc: 'Severe dehydration, shock risk' },
];

const WATER_SOURCES = [
  'Municipal Tap Water',
  'Contaminated Well',
  'Flooded Riverbank Tap',
  'Open Pond / Lake',
  'Storage Tank',
  'Ground Borewell',
];

export default function ReportCaseScreen() {
  const router = useRouter();

  // Multi-step indicator (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('FEMALE');

  const [selectedSymptoms, setSelectedSymptoms] = useState(['Watery Diarrhea', 'Vomiting']);
  const [customSymptom, setCustomSymptom] = useState('');

  const [severity, setSeverity] = useState('CRITICAL');
  const [symptomDate] = useState(new Date().toISOString());

  const [district, setDistrict] = useState('Central Metro');
  const [locality, setLocality] = useState('Riverbank Slum Colony');
  const [latitude, setLatitude] = useState('12.9613');
  const [longitude, setLongitude] = useState('77.5855');
  const [locationCaptured, setLocationCaptured] = useState(true);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const [waterSource, setWaterSource] = useState('Flooded Riverbank Tap');
  const [waterQualityConcern, setWaterQualityConcern] = useState(true);
  const [flooding, setFlooding] = useState(true);
  const [similarCasesNearby, setSimilarCasesNearby] = useState('12');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Toggle Symptom checkbox
  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      if (selectedSymptoms.length === 1) {
        Alert.alert('Required', 'At least one symptom must be selected.');
        return;
      }
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  // Location Capture with Expo Location
  const handleCaptureLocation = async () => {
    setCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'GPS permission was denied. You may manually enter district and locality or use default coordinates.'
        );
        setCapturingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(loc.coords.latitude.toFixed(4));
      setLongitude(loc.coords.longitude.toFixed(4));
      setLocationCaptured(true);
    } catch (err) {
      console.warn('GPS location error, keeping default coordinates:', err);
      // Fallback coordinates for demo
      setLatitude('12.9613');
      setLongitude('77.5855');
      setLocationCaptured(true);
    } finally {
      setCapturingLocation(false);
    }
  };

  // Submission to Backend
  const handleSubmitCase = async () => {
    if (!age || isNaN(Number(age))) {
      Alert.alert('Validation Error', 'Please enter a valid patient age.');
      setCurrentStep(1);
      return;
    }

    if (selectedSymptoms.length === 0) {
      Alert.alert('Validation Error', 'Select at least one symptom.');
      setCurrentStep(2);
      return;
    }

    if (!district.trim() || !locality.trim()) {
      Alert.alert('Validation Error', 'District and Locality are required.');
      setCurrentStep(4);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      age: Number(age) || 28,
      gender: gender || 'FEMALE',
      symptoms: selectedSymptoms,
      suspectedDisease: selectedSymptoms.includes('Watery Diarrhea') ? 'Cholera' : 'Acute Gastroenteritis',
      symptomDate: symptomDate || new Date().toISOString(),
      severity: severity || 'CRITICAL',
      district: district.trim(),
      locality: locality.trim(),
      latitude: parseFloat(latitude) || 12.9613,
      longitude: parseFloat(longitude) || 77.5855,
      waterSource: waterSource || 'Municipal Tap Water',
      waterQualityConcern: Boolean(waterQualityConcern),
      flooding: Boolean(flooding),
      similarCasesNearby: parseInt(similarCasesNearby, 10) || 0,
      notes: clinicalNotes.trim(),
    };

    try {
      const result = await createCase(payload);
      // Pass actual backend result to the Risk Result Screen
      router.replace({
        pathname: '/risk-result',
        params: {
          resultJson: JSON.stringify(result),
        },
      });
    } catch (error) {
      const errMsg = error.displayMessage || error.message || 'Case submission failed.';
      setSubmitError(errMsg);
      Alert.alert(
        'Server Connection Failed',
        `${errMsg}\n\nWould you like to retry or save this case as an offline draft?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save as Offline Draft',
            onPress: async () => {
              await savePendingCase(payload);
              Alert.alert('Draft Saved', 'Case saved in local Pending Queue with PENDING status. It will be submitted once network is restored.');
              router.replace('/cases');
            },
          },
          { text: 'Retry', onPress: handleSubmitCase },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Report Case" subtitle="Clinical Surveillance Intake" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Step Progress Tracker */}
        <View style={styles.stepTracker}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.stepDot,
                currentStep === s && styles.stepDotActive,
                currentStep > s && styles.stepDotDone,
              ]}
              onPress={() => setCurrentStep(s)}
            >
              <Text
                style={[
                  styles.stepDotText,
                  (currentStep === s || currentStep > s) && styles.stepDotTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {submitError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* STEP 1: PATIENT INFORMATION */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1 OF 5</Text>
              </View>
              <Text style={styles.stepTitle}>Patient Demographics</Text>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient Age (Years)*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 29"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender*</Text>
              <View style={styles.genderRow}>
                {['FEMALE', 'MALE', 'OTHER'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Ionicons
                      name={g === 'FEMALE' ? 'female' : g === 'MALE' ? 'male' : 'transgender'}
                      size={18}
                      color={gender === g ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setCurrentStep(2)}>
              <Text style={styles.nextBtnText}>Continue to Symptoms →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 2: SYMPTOMS SELECTION */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2 OF 5</Text>
              </View>
              <Text style={styles.stepTitle}>Observed Symptoms</Text>
            </View>
            <Text style={styles.hintText}>Select all clinical symptoms exhibited by the patient:</Text>

            <View style={styles.checkboxList}>
              {SYMPTOM_OPTIONS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <TouchableOpacity
                    key={sym}
                    style={[styles.checkboxItem, isSelected && styles.checkboxItemActive]}
                    onPress={() => toggleSymptom(sym)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>
                      {sym}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Symptom */}
            <View style={styles.customSymptomRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Add other symptom..."
                placeholderTextColor={COLORS.textMuted}
                value={customSymptom}
                onChangeText={setCustomSymptom}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomSymptom}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentStep(1)}>
                <Text style={styles.prevBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnHalf} onPress={() => setCurrentStep(3)}>
                <Text style={styles.nextBtnText}>Severity →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SEVERITY & CLINICAL TIMELINE */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 3 OF 5</Text>
              </View>
              <Text style={styles.stepTitle}>Clinical Severity</Text>
            </View>

            <View style={styles.severityList}>
              {SEVERITY_LEVELS.map((sev) => {
                const isSelected = severity === sev.id;
                return (
                  <TouchableOpacity
                    key={sev.id}
                    style={[styles.severityCard, isSelected && styles.severityCardActive]}
                    onPress={() => setSeverity(sev.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sevRadio}>
                      <View style={[styles.radioDot, isSelected && styles.radioDotActive]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sevLabel, isSelected && styles.sevLabelActive]}>
                        {sev.label}
                      </Text>
                      <Text style={styles.sevDesc}>{sev.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Symptom Onset</Text>
              <View style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.dateDisplayText}>Today ({new Date().toLocaleDateString()})</Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentStep(2)}>
                <Text style={styles.prevBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnHalf} onPress={() => setCurrentStep(4)}>
                <Text style={styles.nextBtnText}>Location →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 4: LOCATION & GPS */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 4 OF 5</Text>
              </View>
              <Text style={styles.stepTitle}>Geographic Tagging</Text>
            </View>

            {/* GPS Capture Button */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleCaptureLocation}
              disabled={capturingLocation}
              activeOpacity={0.85}
            >
              {capturingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.gpsBtnContent}>
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                  <Text style={styles.gpsBtnText}>USE MY CURRENT LOCATION</Text>
                </View>
              )}
            </TouchableOpacity>

            {locationCaptured && (
              <View style={styles.coordBox}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.coordText}>
                  Location captured ✓ ({latitude}° N, {longitude}° E)
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>District*</Text>
              <TextInput
                style={styles.textInput}
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. Central Metro"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Locality / Settlement Colony*</Text>
              <TextInput
                style={styles.textInput}
                value={locality}
                onChangeText={setLocality}
                placeholder="e.g. Riverbank Slum Colony"
              />
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentStep(3)}>
                <Text style={styles.prevBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnHalf} onPress={() => setCurrentStep(5)}>
                <Text style={styles.nextBtnText}>Environment →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 5: WATER & ENVIRONMENTAL RISK */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 5 OF 5</Text>
              </View>
              <Text style={styles.stepTitle}>Environmental Indicators</Text>
            </View>

            {/* Water Source */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Water Source</Text>
              <View style={styles.sourceGrid}>
                {WATER_SOURCES.map((src) => (
                  <TouchableOpacity
                    key={src}
                    style={[styles.sourcePill, waterSource === src && styles.sourcePillActive]}
                    onPress={() => setWaterSource(src)}
                  >
                    <Text style={[styles.sourceText, waterSource === src && styles.sourceTextActive]}>
                      {src}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Water Quality Concern */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Water Contamination Concern?</Text>
                <Text style={styles.toggleDesc}>Turbidity, odor, or color issues reported</Text>
              </View>
              <View style={styles.yesNoGroup}>
                <TouchableOpacity
                  style={[styles.yesNoBtn, waterQualityConcern && styles.yesBtnActive]}
                  onPress={() => setWaterQualityConcern(true)}
                >
                  <Text style={[styles.yesNoText, waterQualityConcern && styles.yesNoTextActive]}>
                    YES
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, !waterQualityConcern && styles.noBtnActive]}
                  onPress={() => setWaterQualityConcern(false)}
                >
                  <Text style={[styles.yesNoText, !waterQualityConcern && styles.yesNoTextActive]}>
                    NO
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Flooding */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Recent Flooding / Waterlogging?</Text>
                <Text style={styles.toggleDesc}>Submerged pathways or overflow drains</Text>
              </View>
              <View style={styles.yesNoGroup}>
                <TouchableOpacity
                  style={[styles.yesNoBtn, flooding && styles.yesBtnActive]}
                  onPress={() => setFlooding(true)}
                >
                  <Text style={[styles.yesNoText, flooding && styles.yesNoTextActive]}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, !flooding && styles.noBtnActive]}
                  onPress={() => setFlooding(false)}
                >
                  <Text style={[styles.yesNoText, !flooding && styles.yesNoTextActive]}>NO</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Similar Cases Nearby */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Similar Cases Nearby</Text>
              <TextInput
                style={styles.textInput}
                value={similarCasesNearby}
                onChangeText={setSimilarCasesNearby}
                keyboardType="numeric"
                placeholder="e.g. 12"
              />
            </View>

            {/* Field Notes (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field Triage Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                value={clinicalNotes}
                onChangeText={setClinicalNotes}
                multiline
                numberOfLines={2}
                placeholder="Clinical observations, water color/turbidity, patient status..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmitCase}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitBtnText}>Submitting case to server...</Text>
                </View>
              ) : (
                <View style={styles.submittingRow}>
                  <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>SUBMIT CASE FOR RISK EVALUATION</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backStepBtn}
              onPress={() => setCurrentStep(4)}
              disabled={submitting}
            >
              <Text style={styles.backStepText}>← Back to Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepTracker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  stepDotDone: {
    backgroundColor: '#0EA5E9',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  stepBadgeText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.navy,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.sm,
  },
  nextBtnHalf: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  prevBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  prevBtnText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  checkboxList: {
    gap: 8,
    marginBottom: 14,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  checkboxLabelActive: {
    fontWeight: '700',
    color: COLORS.navy,
  },
  customSymptomRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  severityList: {
    gap: 10,
    marginBottom: 16,
  },
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  severityCardActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDA4AF',
  },
  sevRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioDotActive: {
    backgroundColor: '#EF4444',
  },
  sevLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sevLabelActive: {
    color: '#BE123C',
  },
  sevDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dateDisplayText: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '600',
  },
  gpsBtn: {
    backgroundColor: '#0284C7',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  gpsBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  coordText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourcePill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sourcePillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sourceTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  toggleDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  yesNoGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  yesNoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  yesBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  noBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  yesNoText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  yesNoTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...SHADOWS.md,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backStepBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backStepText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
});
