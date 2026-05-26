import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import Header from '../components/Header';
import { formatDateTimeLocal } from '../utils/dateUtils';
import { resolvePhotoUri } from '../utils/photoUrl';

const PHOTO_PREVIEW_H = Math.round(Dimensions.get('window').height * 0.72);

function normalizeForSearch(str: unknown): string {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

type AdminPenaltyMember = {
  id?: number;
  firstname?: string;
  lastname?: string;
  username?: string;
};

type AdminPenaltyTeam = {
  id: number;
  name: string;
  competition?: { id?: number; name?: string };
  members?: AdminPenaltyMember[];
  /** Hors compétition (journal perso), exclu des pénalités */
  isPersonalJournal?: boolean;
};

type PenaltyCatchRow = {
  id: number;
  species?: { name: string };
  size: number;
  points: number;
  createdAt?: string;
  photoUrl?: string | null;
};

export default function AdminPenaltyScreen() {
  const queryClient = useQueryClient();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [competitionId, setCompetitionId] = useState<number | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamId, setTeamId] = useState<number | null>(null);
  const [scope, setScope] = useState<'global' | 'catch'>('global');
  const [catchId, setCatchId] = useState<number | null>(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: competitionsRaw, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['admin-competitions-penalty'],
    queryFn: () => adminService.getCompetitions(),
  });

  const { data: teamsList = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['admin-teams-penalty'],
    queryFn: () => adminService.getTeams(),
  });

  const competitions = useMemo(() => {
    if (competitionsRaw == null) return [] as Array<{ id: number; name?: string }>;
    const raw = Array.isArray(competitionsRaw)
      ? competitionsRaw
      : (competitionsRaw as { competitions?: unknown[] }).competitions ?? [];
    const list = (Array.isArray(raw) ? raw : []) as Array<{ id: number; name?: string }>;
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'fr'));
  }, [competitionsRaw]);

  const teams = useMemo(() => {
    const arr = Array.isArray(teamsList)
      ? teamsList
      : (teamsList as { teams?: unknown })?.teams ?? [];
    return arr as AdminPenaltyTeam[];
  }, [teamsList]);

  const eligibleTeams = useMemo(() => {
    if (competitionId == null) return [];
    const cid = Number(competitionId);
    return teams.filter((t) => {
      if (t.isPersonalJournal === true) return false;
      if (t.competition == null) return false;
      return Number(t.competition.id) === cid;
    });
  }, [teams, competitionId]);

  const filteredTeams = useMemo(() => {
    const q = normalizeForSearch(teamSearch);
    if (!q) return [];
    return eligibleTeams.filter((t) => {
      if (normalizeForSearch(t.name).includes(q)) return true;
      for (const m of t.members ?? []) {
        if (normalizeForSearch(m.firstname).includes(q)) return true;
        if (normalizeForSearch(m.lastname).includes(q)) return true;
        if (normalizeForSearch(m.username).includes(q)) return true;
      }
      return false;
    });
  }, [eligibleTeams, teamSearch]);

  const searchQueryTrimmed = teamSearch.trim();

  const {
    data: penaltyCatchesRes,
    isFetching: loadingPenaltyCatches,
    isError: penaltyCatchesError,
  } = useQuery({
    queryKey: ['admin-penalty-eligible-catches', teamId],
    queryFn: () => adminService.getTeamPenaltyEligibleCatches(teamId as number),
    enabled: teamId != null && scope === 'catch',
  });

  const { data: penaltiesRes, refetch: refetchPenalties } = useQuery({
    queryKey: ['admin-penalties', teamId],
    queryFn: () => adminService.getTeamPenalties(teamId as number),
    enabled: teamId != null,
  });

  const penalties = penaltiesRes?.penalties ?? [];
  const totalPen = penaltiesRes?.totalPenaltyPoints ?? 0;

  const penaltyEligibleCatches =
    penaltyCatchesRes?.success === true && Array.isArray(penaltyCatchesRes.catches)
      ? penaltyCatchesRes.catches
      : [];

  const loadingHeader = loadingCompetitions || loadingTeams;

  const resetTeamSelection = () => {
    setTeamId(null);
    setCatchId(null);
    setTeamSearch('');
  };

  const handleSubmit = async () => {
    const p = parseInt(points.replace(/[^\d]/g, ''), 10);
    if (competitionId == null) {
      Alert.alert('Erreur', 'Choisissez une compétition.');
      return;
    }
    if (!teamId) {
      Alert.alert('Erreur', 'Choisissez une équipe.');
      return;
    }
    if (!Number.isFinite(p) || p < 1) {
      Alert.alert('Erreur', 'Indiquez un nombre de points positif à retirer.');
      return;
    }
    if (scope === 'catch' && catchId == null) {
      Alert.alert('Erreur', 'Choisissez une prise de référence.');
      return;
    }
    setBusy(true);
    try {
      await adminService.createTeamPenalty(teamId, {
        points: p,
        reason: reason.trim() || undefined,
        fishCatchId: scope === 'catch' && catchId != null ? catchId : undefined,
      });
      Alert.alert('Succès', 'Pénalité enregistrée.');
      setPoints('');
      setReason('');
      setCatchId(null);
      refetchPenalties();
      await queryClient.invalidateQueries({ queryKey: ['admin-penalty-eligible-catches', teamId] });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Erreur', err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Pénalités (score)" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.help}>
          Uniquement les équipes engagées en compétition (le journal personnel n&apos;apparaît pas). Choisissez la
          compétition, puis saisissez une recherche : les équipes s&apos;affichent une fois au moins un caractère entré.
          Les points sont retirés du score officiel de l&apos;équipe (plancher à 0).
        </Text>

        {loadingHeader ? (
          <ActivityIndicator color="#007AFF" style={{ marginVertical: 16 }} />
        ) : (
          <>
            <Text style={styles.label}>Compétition *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {competitions.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, competitionId === c.id && styles.chipSelected]}
                  onPress={() => {
                    setCompetitionId(c.id);
                    resetTeamSelection();
                  }}
                >
                  <Text style={[styles.chipText, competitionId === c.id && styles.chipTextSelected]}>
                    {c.name ?? `Competition #${c.id}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!competitionId ? (
              <Text style={styles.hintMuted}>Sélectionnez une compétition pour afficher les équipes.</Text>
            ) : eligibleTeams.length === 0 ? (
              <Text style={styles.hintMuted}>Aucune équipe inscrite à cette compétition.</Text>
            ) : (
              <>
                <Text style={styles.label}>Rechercher une équipe</Text>
                <TextInput
                  style={styles.input}
                  value={teamSearch}
                  onChangeText={setTeamSearch}
                  placeholder="Nom d'équipe, prénom, nom ou pseudo…"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.countHint}>
                  {!searchQueryTrimmed
                    ? `Saisissez du texte pour afficher les équipes (${eligibleTeams.length} dans cette compétition).`
                    : `${filteredTeams.length} équipe${filteredTeams.length > 1 ? 's' : ''} correspondant à la recherche`}
                </Text>

                <Text style={styles.label}>Équipe *</Text>
                <ScrollView style={styles.teamList} nestedScrollEnabled showsVerticalScrollIndicator>
                  {!searchQueryTrimmed ? (
                    <Text style={styles.hintMuted}>
                      La liste des équipes apparaît dès que vous entrez au moins un caractère dans la recherche.
                    </Text>
                  ) : filteredTeams.length === 0 ? (
                    <Text style={styles.hintMuted}>Aucune équipe ne correspond à cette recherche.</Text>
                  ) : (
                    filteredTeams.map((t) => {
                      const line = (t.members ?? [])
                        .slice(0, 5)
                        .map((m) =>
                          [m.firstname, m.lastname].filter(Boolean).join(' ').trim() || (m.username ?? '')
                        )
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.teamRow, teamId === t.id && styles.teamRowSel]}
                          onPress={() => {
                            setTeamId(t.id);
                            setCatchId(null);
                          }}
                        >
                          <Text style={styles.teamRowName}>{t.name}</Text>
                          {line.length > 0 ? <Text style={styles.teamRowMembers}>{line}</Text> : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </>
            )}

            {teamId != null && (
              <>
                <Text style={styles.label}>Portée</Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.scopeBtn, scope === 'global' && styles.scopeBtnSel]}
                    onPress={() => setScope('global')}
                  >
                    <Text style={[styles.scopeBtnText, scope === 'global' && styles.scopeBtnTextSel]}>
                      Globale
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scopeBtn, scope === 'catch' && styles.scopeBtnSel]}
                    onPress={() => setScope('catch')}
                  >
                    <Text style={[styles.scopeBtnText, scope === 'catch' && styles.scopeBtnTextSel]}>
                      Par prise (réf.)
                    </Text>
                  </TouchableOpacity>
                </View>

                {scope === 'catch' && (
                  <>
                    <Text style={styles.label}>Prise de référence * ({penaltyEligibleCatches.length})</Text>
                    <Text style={styles.hintMutedCompact}>
                      Appuyez sur la vignette pour voir la photo en grand. Utilisez « Sélectionner » pour lier cette
                      pénalité à une prise.
                    </Text>
                    {loadingPenaltyCatches ? (
                      <ActivityIndicator color="#007AFF" style={{ marginVertical: 12 }} />
                    ) : penaltyCatchesError ? (
                      <Text style={styles.hintMuted}>
                        Impossible de charger les prises. Vérifiez votre connexion et que votre compte a bien les droits
                        administrateur sur le serveur.
                      </Text>
                    ) : penaltyEligibleCatches.length === 0 ? (
                      <Text style={styles.hintMuted}>
                        Aucune prise valide disponible pour cette équipe dans cette compétition (prises en attente ou
                        rejetées exclues).
                      </Text>
                    ) : (
                      <ScrollView style={styles.catchList} nestedScrollEnabled showsVerticalScrollIndicator>
                        {(penaltyEligibleCatches as PenaltyCatchRow[]).map((c) => {
                          const thumb = resolvePhotoUri(c.photoUrl);
                          const sel = catchId === c.id;
                          return (
                            <View key={c.id} style={[styles.catchCard, sel && styles.catchCardSel]}>
                              <TouchableOpacity
                                style={styles.catchThumbTouchable}
                                activeOpacity={0.85}
                                onPress={() => {
                                  const u = resolvePhotoUri(c.photoUrl);
                                  if (u) setPreviewUri(u);
                                  else {
                                    Alert.alert('Photo', 'Aucune photo n’a été envoyée pour cette prise.');
                                  }
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Agrandir la photo de la prise ${c.id}`}
                              >
                                {thumb ? (
                                  <Image source={{ uri: thumb }} style={styles.catchThumbImg} resizeMode="cover" />
                                ) : (
                                  <View style={styles.catchThumbPlaceholder}>
                                    <Text style={styles.catchThumbPlaceholderText}>Photo</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                              <View style={styles.catchCardBody}>
                                <Text style={styles.catchDatetime} numberOfLines={2}>
                                  {formatDateTimeLocal(c.createdAt)}
                                </Text>
                                <Text style={styles.catchRowMain} numberOfLines={2}>
                                  <Text style={styles.catchHash}>#{c.id}</Text>
                                  {' · '}
                                  {c.species?.name ?? '?'}
                                </Text>
                                <Text style={styles.catchRowMeta}>
                                  {c.size} cm · {c.points} pts
                                </Text>
                                <TouchableOpacity
                                  style={[styles.catchSelectBtn, sel && styles.catchSelectBtnSel]}
                                  onPress={() => setCatchId(c.id)}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: sel }}
                                >
                                  <Text style={[styles.catchSelectBtnText, sel && styles.catchSelectBtnTextSel]}>
                                    {sel ? 'Sélectionnée ✓' : 'Sélectionner'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>
                    )}

                    {penaltyEligibleCatches.length > 0 && (
                      <View style={styles.penaltyFormCard}>
                        <Text style={styles.penaltyFormCardTitle}>Saisie de la pénalité</Text>
                        {catchId == null ? (
                          <Text style={styles.hintMutedCompact}>
                            Choisissez d’abord une prise avec le bouton « Sélectionner ».
                          </Text>
                        ) : (
                          <Text style={styles.selectedCatchSummary}>
                            Prise #{catchId} sélectionnée — indiquez combien de points retirer au score.
                          </Text>
                        )}
                        <Text style={[styles.label, styles.labelInCard]}>Points à retirer *</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="number-pad"
                          placeholder="Ex. 50"
                          value={points}
                          onChangeText={(v) => setPoints(v.replace(/[^\d]/g, ''))}
                          editable={catchId != null}
                        />
                        <Text style={[styles.label, styles.labelInCard]}>Motif (optionnel)</Text>
                        <TextInput
                          style={[styles.input, styles.area]}
                          value={reason}
                          onChangeText={setReason}
                          multiline
                          placeholder="Motif"
                          editable={catchId != null}
                        />
                      </View>
                    )}
                  </>
                )}

                {scope === 'global' && (
                  <>
                    <Text style={styles.label}>Points à retirer *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="Ex. 50"
                      value={points}
                      onChangeText={(v) => setPoints(v.replace(/[^\d]/g, ''))}
                    />
                    <Text style={styles.label}>Motif (optionnel)</Text>
                    <TextInput
                      style={[styles.input, styles.area]}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      placeholder="Motif"
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.submit,
                    (busy || (scope === 'catch' && catchId == null)) && styles.submitDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={busy || (scope === 'catch' && catchId == null)}
                >
                  <Text style={styles.submitText}>{busy ? 'Enregistrement…' : 'Enregistrer la pénalité'}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Total pénalités : −{totalPen} pts</Text>
                {penalties.map((pen: { id: number; points: number; speciesName?: string; reason?: string }) => (
                  <View key={pen.id} style={styles.pItem}>
                    <Text style={{ flex: 1 }}>
                      −{pen.points} pts
                      {pen.speciesName ? ` (${pen.speciesName})` : ''}{' '}
                      {pen.reason ? ` — ${pen.reason}` : ''}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Supprimer', 'Retirer cette pénalité du score ?', [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await adminService.deleteTeamPenalty(teamId, pen.id);
                                refetchPenalties();
                              } catch (e: unknown) {
                                const er = e as { response?: { data?: { message?: string } } };
                                Alert.alert('Erreur', er.response?.data?.message || 'Erreur');
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.del}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={previewUri != null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.photoModalBackdrop}>
          <TouchableOpacity style={styles.photoModalCloseTap} activeOpacity={1} onPress={() => setPreviewUri(null)}>
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={[styles.photoModalImage, { height: PHOTO_PREVIEW_H }]}
              resizeMode="contain"
            />
          ) : null}
          <TouchableOpacity style={styles.photoModalDoneButton} onPress={() => setPreviewUri(null)}>
            <Text style={styles.photoModalDoneText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  help: { fontSize: 14, color: '#555', marginBottom: 16 },
  hintMuted: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 8 },
  countHint: { fontSize: 12, color: '#666', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 8 },
  chip: {
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    maxWidth: 220,
  },
  chipSelected: { borderColor: '#007AFF', backgroundColor: '#e8f4ff' },
  chipText: { fontSize: 13 },
  chipTextSelected: { fontWeight: '700' },
  teamList: { maxHeight: 220, marginBottom: 4 },
  teamRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  teamRowSel: { borderColor: '#007AFF', backgroundColor: '#f0f8ff' },
  teamRowName: { fontSize: 15, fontWeight: '700', color: '#111' },
  teamRowMembers: { fontSize: 13, color: '#555', marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  scopeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  scopeBtnSel: { backgroundColor: '#5856d6' },
  scopeBtnText: { fontWeight: '600', color: '#333' },
  scopeBtnTextSel: { color: '#fff' },
  catchList: { maxHeight: 420, marginBottom: 8 },
  catchCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    alignItems: 'flex-start',
    gap: 10,
  },
  catchCardSel: { borderColor: '#007AFF', backgroundColor: '#f7fbff' },
  catchThumbTouchable: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  catchThumbImg: { width: 92, height: 92 },
  catchThumbPlaceholder: {
    width: 92,
    height: 92,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catchThumbPlaceholderText: { fontSize: 11, color: '#999', fontWeight: '600' },
  catchCardBody: { flex: 1, minWidth: 0 },
  catchDatetime: { fontSize: 12, color: '#333', marginBottom: 6, fontWeight: '600' },
  catchRowMain: { fontSize: 15, fontWeight: '600', color: '#111' },
  catchHash: { fontVariant: ['tabular-nums'] },
  catchRowMeta: { fontSize: 13, color: '#555', marginTop: 4 },
  catchSelectBtn: {
    alignSelf: 'stretch',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  catchSelectBtnSel: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  catchSelectBtnText: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  catchSelectBtnTextSel: { color: '#fff' },
  penaltyFormCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#cce0f5',
  },
  penaltyFormCardTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 10 },
  hintMutedCompact: { fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 18 },
  labelInCard: { marginTop: 6 },
  selectedCatchSummary: { fontSize: 13, color: '#0c4a6e', marginBottom: 6, fontWeight: '700' },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 56,
    paddingBottom: 32,
  },
  photoModalCloseTap: {
    position: 'absolute',
    top: 44,
    right: 14,
    zIndex: 2,
    padding: 12,
  },
  photoModalCloseText: { color: '#fff', fontSize: 32, lineHeight: 34, fontWeight: '200' },
  photoModalImage: { width: '100%' },
  photoModalDoneButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  photoModalDoneText: { fontWeight: '700', color: '#111', fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  area: { minHeight: 70, textAlignVertical: 'top' },
  submit: {
    backgroundColor: '#d97706',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  del: { color: '#c00', fontWeight: '600' },
});
