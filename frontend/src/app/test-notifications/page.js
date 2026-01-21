'use client';

import { useState, useEffect } from 'react';
import styles from './test-notifications.module.scss';

const NOTIFICATION_TYPES = [
    { value: 'catch_validated', label: 'Prise validée', color: '#10b981' },
    { value: 'catch_rejected', label: 'Prise rejetée', color: '#ef4444' },
    { value: 'team_invitation', label: 'Invitation d\'équipe', color: '#3b82f6' },
    { value: 'competition_registered', label: 'Inscription compétition', color: '#8b5cf6' },
    { value: 'competition_started', label: 'Compétition démarrée', color: '#f59e0b' },
    { value: 'competition_ended', label: 'Compétition terminée', color: '#6b7280' },
    { value: 'competition_paused', label: 'Compétition en pause', color: '#f97316' },
    { value: 'competition_resumed', label: 'Compétition reprise', color: '#14b8a6' },
    { value: 'catch_pending', label: 'Nouvelle prise en attente (admin)', color: '#ec4899' },
];

export default function TestNotificationsPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [targetUserId, setTargetUserId] = useState('');

    const getAuthToken = () => {
        // Récupérer le token depuis le localStorage ou les cookies
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            return token;
        }
        return null;
    };

    const sendNotification = async (type) => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token d\'authentification non trouvé. Veuillez vous connecter.');
                setLoading(false);
                return;
            }

            const body = { type };
            if (targetUserId) {
                body.userId = parseInt(targetUserId);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/test/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'envoi de la notification');
            }

            setMessage(`✅ ${data.message}`);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const sendAllNotifications = async () => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token d\'authentification non trouvé. Veuillez vous connecter.');
                setLoading(false);
                return;
            }

            const body = {};
            if (targetUserId) {
                body.userId = parseInt(targetUserId);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/test/notifications/send-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'envoi des notifications');
            }

            setMessage(`✅ ${data.message}`);
            console.log('Résultats détaillés:', data.results);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🧪 Tests de Notifications Push</h1>
                <p className={styles.description}>
                    Cette page permet de tester toutes les notifications push de l'application.
                    <br />
                    <strong>⚠️ Accessible uniquement aux administrateurs</strong>
                </p>
            </div>

            <div className={styles.config}>
                <label>
                    <strong>ID Utilisateur cible (optionnel) :</strong>
                    <input
                        type="number"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        placeholder="Laisser vide pour utiliser votre compte"
                        className={styles.input}
                    />
                </label>
                <small>Si vide, les notifications seront envoyées à votre compte connecté</small>
            </div>

            {message && (
                <div className={styles.message}>
                    {message}
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.actions}>
                <button
                    onClick={sendAllNotifications}
                    disabled={loading}
                    className={styles.buttonAll}
                >
                    {loading ? '⏳ Envoi...' : '📤 Envoyer toutes les notifications'}
                </button>
            </div>

            <div className={styles.types}>
                <h2>Types de notifications disponibles</h2>
                <div className={styles.grid}>
                    {NOTIFICATION_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => sendNotification(type.value)}
                            disabled={loading}
                            className={styles.typeButton}
                            style={{ borderLeftColor: type.color }}
                        >
                            <span className={styles.typeLabel}>{type.label}</span>
                            <span className={styles.typeValue}>{type.value}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.info}>
                <h3>ℹ️ Instructions</h3>
                <ul>
                    <li>Assurez-vous d'être connecté en tant qu'administrateur</li>
                    <li>Vérifiez que votre appareil mobile a bien enregistré un token Expo Push</li>
                    <li>Les notifications seront envoyées à votre compte (ou à l'ID spécifié)</li>
                    <li>Vérifiez votre téléphone pour voir les notifications push</li>
                    <li>Les notifications respectent les préférences utilisateur</li>
                </ul>
            </div>
        </div>
    );
}
