import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

/** Roulette iOS : en mode sombre système, UIDatePicker peut garder des labels blancs sur fond clair du modal */
const IOS_SPINNER_VISUAL_PROPS =
  Platform.OS === 'ios'
    ? ({
        themeVariant: 'light' as const,
        textColor: '#111827',
      } as const)
    : {};

export type ScheduledPauseFormValues = {
  startDate: Date;
  endDate: Date;
  reason: string;
};

type Props = {
  visible: boolean;
  competitionStart: Date;
  competitionEnd: Date;
  initial?: ScheduledPauseFormValues | null;
  title?: string;
  onClose: () => void;
  onSave: (v: ScheduledPauseFormValues) => void;
};

function clampDate(d: Date, min: Date, max: Date): Date {
  const t = d.getTime();
  const tMin = min.getTime();
  const tMax = max.getTime();
  if (t < tMin) return new Date(tMin);
  if (t > tMax) return new Date(tMax);
  return d;
}

function defaultPauseRange(competitionStart: Date, competitionEnd: Date): { start: Date; end: Date } {
  const midMs = (competitionStart.getTime() + competitionEnd.getTime()) / 2;
  const start = new Date(midMs);
  start.setMinutes(0, 0, 0);
  let end = new Date(start);
  end.setHours(end.getHours() + 1);
  if (end > competitionEnd) {
    end = new Date(competitionEnd);
    start.setTime(end.getTime() - 60 * 60 * 1000);
  }
  if (start < competitionStart) {
    start.setTime(competitionStart.getTime());
    end = new Date(Math.min(competitionStart.getTime() + 60 * 60 * 1000, competitionEnd.getTime()));
  }
  if (end <= start) {
    end = new Date(Math.min(start.getTime() + 30 * 60 * 1000, competitionEnd.getTime()));
  }
  return { start: clampDate(start, competitionStart, competitionEnd), end: clampDate(end, competitionStart, competitionEnd) };
}

export default function ScheduledPauseFormModal({
  visible,
  competitionStart,
  competitionEnd,
  initial,
  title = 'Pause programmée',
  onClose,
  onSave,
}: Props) {
  const [startDate, setStartDate] = useState<Date>(() => competitionStart);
  const [endDate, setEndDate] = useState<Date>(() => competitionEnd);
  const [reason, setReason] = useState('');

  /** iOS : roues datetime */
  const [iosShowStartPicker, setIosShowStartPicker] = useState(false);
  const [iosShowEndPicker, setIosShowEndPicker] = useState(false);
  /** Android : spinner datetime inline (évite une 2e dialog native dans un RN Modal) */
  const [androidShowStartPicker, setAndroidShowStartPicker] = useState(false);
  const [androidShowEndPicker, setAndroidShowEndPicker] = useState(false);

  /** Évite de réinitialiser les dates à chaque render du parent (objet `initial` recréé) pendant que l’utilisateur tourne les roues. */
  const initialRef = useRef(initial);
  const boundsRef = useRef({ competitionStart, competitionEnd });
  initialRef.current = initial;
  boundsRef.current = { competitionStart, competitionEnd };

  useEffect(() => {
    if (!visible) return;
    const init = initialRef.current;
    const { competitionStart: cs, competitionEnd: ce } = boundsRef.current;
    const { start, end } = init
      ? {
          start: clampDate(init.startDate, cs, ce),
          end: clampDate(init.endDate, cs, ce),
        }
      : defaultPauseRange(cs, ce);
    setStartDate(start);
    setEndDate(end <= start ? new Date(Math.min(start.getTime() + 60 * 60 * 1000, ce.getTime())) : end);
    setReason(init?.reason ?? '');
    setIosShowStartPicker(false);
    setIosShowEndPicker(false);
    setAndroidShowStartPicker(false);
    setAndroidShowEndPicker(false);
  }, [visible]);

  const applyStart = (d: Date) => {
    const { competitionStart: cs, competitionEnd: ce } = boundsRef.current;
    const next = clampDate(d, cs, ce);
    setStartDate(next);
    setEndDate((prevEnd) => {
      if (next < prevEnd) return prevEnd;
      const ne = new Date(Math.min(next.getTime() + 60 * 60 * 1000, ce.getTime()));
      return ne > next ? ne : new Date(Math.min(next.getTime() + 30 * 60 * 1000, ce.getTime()));
    });
  };

  const applyEnd = (d: Date) => {
    const { competitionStart: cs, competitionEnd: ce } = boundsRef.current;
    setEndDate(clampDate(d, cs, ce));
  };

  const onIosStartChange = (_: any, date?: Date) => {
    if (!date || _?.type === 'dismissed') return;
    applyStart(date);
  };

  const onIosEndChange = (_: any, date?: Date) => {
    if (!date || _?.type === 'dismissed') return;
    applyEnd(date);
  };

  /** Android spinner : un événement par cran ; pas de fermeture automatique */
  const onAndroidStartChange = (_: any, date?: Date) => {
    if (!date) return;
    applyStart(date);
  };

  const onAndroidEndChange = (_: any, date?: Date) => {
    if (!date) return;
    applyEnd(date);
  };

  const validateAndSave = () => {
    const { competitionStart: cs, competitionEnd: ce } = boundsRef.current;
    if (startDate < cs || endDate > ce) {
      Alert.alert('Dates invalides', 'La pause doit être entièrement comprise dans la période de la compétition.');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Dates invalides', 'La fin de la pause doit être après le début.');
      return;
    }
    onSave({ startDate, endDate, reason: reason.trim() });
  };

  const { competitionStart: cs, competitionEnd: ce } = boundsRef.current;

  const openStartPicker = () => {
    setIosShowEndPicker(false);
    setAndroidShowEndPicker(false);
    if (Platform.OS === 'android') {
      setAndroidShowStartPicker(true);
    } else {
      setIosShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    setIosShowStartPicker(false);
    setAndroidShowStartPicker(false);
    if (Platform.OS === 'android') {
      setAndroidShowEndPicker(true);
    } else {
      setIosShowEndPicker(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Début de la pause</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={openStartPicker}>
              <Text style={styles.dateBtnText}>
                {startDate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Fin de la pause</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={openEndPicker}>
              <Text style={styles.dateBtnText}>
                {endDate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Motif (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="Ex. : relâché commun"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={validateAndSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </ScrollView>

          {Platform.OS === 'android' && androidShowStartPicker && (
            <View style={[styles.pickerDock, styles.pickerDockAndroid]}>
              <View style={styles.pickerToolbar}>
                <Text style={[styles.pickerToolbarTitle, styles.pickerToolbarTitleAndroid]}>Date et heure de début</Text>
                <TouchableOpacity style={styles.pickerOkBtn} onPress={() => setAndroidShowStartPicker(false)}>
                  <Text style={styles.pickerOkText}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={onAndroidStartChange}
                minimumDate={cs}
                maximumDate={ce}
              />
            </View>
          )}
          {Platform.OS === 'android' && androidShowEndPicker && (
            <View style={[styles.pickerDock, styles.pickerDockAndroid]}>
              <View style={styles.pickerToolbar}>
                <Text style={[styles.pickerToolbarTitle, styles.pickerToolbarTitleAndroid]}>Date et heure de fin</Text>
                <TouchableOpacity style={styles.pickerOkBtn} onPress={() => setAndroidShowEndPicker(false)}>
                  <Text style={styles.pickerOkText}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="spinner"
                onChange={onAndroidEndChange}
                minimumDate={startDate}
                maximumDate={ce}
              />
            </View>
          )}

          {Platform.OS === 'ios' && iosShowStartPicker && (
            <View style={styles.pickerDock}>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={onIosStartChange}
                minimumDate={cs}
                maximumDate={ce}
                {...IOS_SPINNER_VISUAL_PROPS}
              />
              <TouchableOpacity style={styles.doneIos} onPress={() => setIosShowStartPicker(false)}>
                <Text style={styles.doneIosText}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
          {Platform.OS === 'ios' && iosShowEndPicker && (
            <View style={styles.pickerDock}>
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="spinner"
                onChange={onIosEndChange}
                minimumDate={startDate}
                maximumDate={ce}
                {...IOS_SPINNER_VISUAL_PROPS}
              />
              <TouchableOpacity style={styles.doneIos} onPress={() => setIosShowEndPicker(false)}>
                <Text style={styles.doneIosText}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  pickerDock: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  /** Spinner Android : texte souvent très clair ; fond foncé pour garder un contraste lisible (issue communautaire du picker). */
  pickerDockAndroid: {
    backgroundColor: '#3a3a3c',
    borderTopColor: '#48484a',
  },
  pickerToolbarTitleAndroid: {
    color: '#f5f5f7',
  },
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pickerToolbarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  pickerOkBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerOkText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateBtn: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateBtnText: {
    fontSize: 16,
    color: '#333',
  },
  doneIos: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  doneIosText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
