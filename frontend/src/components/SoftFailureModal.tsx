import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard, PrimaryButton } from '../ui';
import { StoredMission } from '../state';

export type SoftFailureModalProps = {
  visible: boolean;
  mission: StoredMission;
  onClose: () => void;
  onRepair: (repair: string) => void;
};

export default function SoftFailureModal({ visible, mission, onClose, onRepair }: SoftFailureModalProps) {
  const repairTask = useMemo(() => {
    if (mission.minutes >= 30) {
      return `Reescreva essa missão em 8 minutos com uma intenção mais clara e um único resultado. ${mission.title}`;
    }
    if (mission.minutes >= 15) {
      return `Quebre a tarefa em três passos de 5 minutos: preparar, agir, revisar.`;
    }
    return `Execute um impulso de 5 minutos para restaurar confiança e mova o progresso adiante.`;
  }, [mission]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <GlassCard style={styles.modalCard} tint="rgba(250,178,25,0.08)">
          <Text style={styles.title}>Falha suave detectada</Text>
          <Text style={styles.subtitle}>A missão não foi cumprida, mas o impulso não precisa quebrar.</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Missão</Text>
            <Text style={styles.taskTitle}>{mission.title}</Text>
            <Text style={styles.taskMeta}>{mission.minutes} min · {mission.kind || 'rotina'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Micro-reparo</Text>
            <Text style={styles.repairText}>{repairTask}</Text>
          </View>

          <View style={styles.buttonRow}>
            <PrimaryButton label="Reparar agora" icon="hammer" onPress={() => onRepair(repairTask)} />
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Continuar depois</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { padding: 22, borderRadius: 28, backgroundColor: 'rgba(12,10,22,0.96)' },
  title: { color: '#F8FAFC', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 18 },
  section: { marginBottom: 18 },
  label: { color: '#A78BFA', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  taskTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  taskMeta: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  repairText: { color: '#E2E8F0', fontSize: 14, lineHeight: 22 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancelBtn: { marginLeft: 12, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cancelText: { color: '#A5B4FC', fontSize: 13, fontWeight: '700' },
});
