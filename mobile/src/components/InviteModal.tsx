import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Feather';
import { triggerHaptic } from '../services/haptics';
import { BACKEND_URL } from '../config/network';

interface InviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  roomId: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isVisible, onClose, roomId }) => {
  const joinUrl = `${BACKEND_URL}/join/${roomId}`;

  const onCopyCode = async () => {
    // Usually we would use Clipboard here, but for now let's just trigger haptic
    // and we can add clipboard later if needed. 
    // For now we just use the native share as the primary action.
    triggerHaptic('success');
  };

  const onShareLink = async () => {
    try {
      await Share.share({
        message: `Join my AURA room: ${joinUrl}`,
        title: 'AURA Invite',
        url: joinUrl,
      });
    } catch (error) {
      console.warn('Share failed', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ROOM INVITE</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={joinUrl}
                size={200}
                color="#FAFAFA"
                backgroundColor="transparent"
              />
            </View>
            <Text style={styles.hint}>Scan to join frequency</Text>
          </View>

          {/* Room ID Section */}
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>TARGET FREQUENCY</Text>
            <Text style={styles.idValue}>{roomId.toUpperCase()}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={onShareLink}
              activeOpacity={0.8}
            >
              <Icon name="share-2" size={18} color="#09090B" />
              <Text style={styles.primaryBtnText}>Share Link</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  content: {
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#22C55E',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#09090B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  hint: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  idContainer: {
    width: '100%',
    backgroundColor: '#09090B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E33',
    alignItems: 'center',
    marginBottom: 24,
  },
  idLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  idValue: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#22C55E',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#09090B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#71717A',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default InviteModal;
