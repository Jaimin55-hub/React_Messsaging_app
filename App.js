// App.js
import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Make sure to instal react-native-vector-icons

// Sample friend data
const friends = [
  { name: 'Tinu', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
  { name: 'Jinesh', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { name: 'Charlie', avatar: 'https://randomuser.me/api/portraits/men/23.jpg' },
  { name: 'Diana', avatar: 'https://randomuser.me/api/portraits/women/56.jpg' },
  { name: 'Jainik', avatar: 'https://randomuser.me/api/portraits/men/57.jpg' },
  { name: 'Rahul', avatar: 'https://randomuser.me/api/portraits/women/58.jpg' },
];

function formatRelativeTime(date) {
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);
  if (diffSeconds < 10) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(date) {
  const now = new Date();
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - msgDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

export default function App() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  const handleSend = () => {
    if (message.trim() === '') return;

    const now = new Date();
    if (editingMessage) {
      const updated = conversations[selectedFriend.name].map(msg =>
        msg.id === editingMessage.id ? { ...msg, text: message } : msg
      );
      setConversations({ ...conversations, [selectedFriend.name]: updated });
      setEditingMessage(null);
    } else {
      const newMsg = {
        id: Date.now().toString(),
        text: message,
        sender: 'You',
        time: now,
        status: 'sent',
      };
      const updated = [...(conversations[selectedFriend.name] || []), newMsg];
      setConversations({ ...conversations, [selectedFriend.name]: updated });

      setTimeout(() => updateStatus(newMsg.id, 'delivered'), 1000);
      setTimeout(() => updateStatus(newMsg.id, 'read'), 3000);
      setTimeout(() => autoReply(), 4000);
    }
    setMessage('');
  };

  const updateStatus = (id, status) => {
    setConversations(prev => {
      const updated = prev[selectedFriend.name].map(msg =>
        msg.id === id ? { ...msg, status } : msg
      );
      return { ...prev, [selectedFriend.name]: updated };
    });
  };

  const autoReply = () => {
    const reply = {
      id: (Date.now() + 1).toString(),
      sender: selectedFriend.name,
      text: 'Got your message! 😊',
      time: new Date(),
    };
    setConversations(prev => ({
      ...prev,
      [selectedFriend.name]: [...(prev[selectedFriend.name] || []), reply],
    }));
  };

  const onMessagePress = (msg) => {
    if (msg.sender === 'You') {
      setEditingMessage({ id: msg.id, text: msg.text });
      setMessage(msg.text);
    }
  };

  const getMessagesWithHeaders = () => {
    if (!conversations[selectedFriend.name]) return [];
    const messages = [...conversations[selectedFriend.name]];
    messages.sort((a, b) => a.time - b.time);

    const result = [];
    let lastLabel = null;
    for (let msg of messages) {
      const label = getDateLabel(new Date(msg.time));
      if (label !== lastLabel) {
        result.push({ id: `header-${label}`, type: 'header', label });
        lastLabel = label;
      }
      result.push({ ...msg, type: 'message' });
    }
    return result.reverse();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return '#888';
      case 'delivered':
        return '#6c5ce7';
      case 'read':
        return '#00b894';
      default:
        return '#ccc';
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.label}</Text>
        </View>
      );
    }

    const isSent = item.sender === 'You';

    return (
      <TouchableOpacity
        style={[styles.messageBubble, isSent ? styles.sent : styles.received]}
        onPress={() => onMessagePress(item)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.messageText}>{item.text}</Text>
          {isSent && (
            <TouchableOpacity
              onPress={() => {
                // Delete immediately without confirmation
                const updated = conversations[selectedFriend.name].filter(m => m.id !== item.id);
                setConversations({ ...conversations, [selectedFriend.name]: updated });

                // Clear editing if applicable
                if (editingMessage?.id === item.id) {
                  setEditingMessage(null);
                  setMessage('');
                }
              }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="trash-bin" size={16} color="#d63031" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.messageMeta}>
          <Text style={styles.timeText}>{formatRelativeTime(new Date(item.time))}</Text>
          {isSent && item.status && (
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!selectedFriend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#90EE90' }]}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.title}>📱 Messaging App</Text>
        <FlatList
          data={friends}
          keyExtractor={item => item.name}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendCard}
              onPress={() => setSelectedFriend(item)}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <Text style={styles.friendName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => {
            setSelectedFriend(null);
            setMessage('');
            setEditingMessage(null);
          }}
        >
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Image source={{ uri: selectedFriend.avatar }} style={styles.chatAvatar} />
        <Text style={styles.chatTitle}>{selectedFriend.name}</Text>
      </View>

      <FlatList
        data={getMessagesWithHeaders()}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messageList}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          {editingMessage && (
            <TouchableOpacity onPress={() => {
              setEditingMessage(null);
              setMessage('');
            }}>
              <Text style={{ color: '#e17055', marginRight: 10 }}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TextInput
            placeholder="Message..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>{editingMessage ? 'Update' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginVertical: 30, color: '#6c5ce7' },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaa7',
    padding: 15,
    marginBottom: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  friendName: { fontSize: 18, fontWeight: '700', color: '#2d3436' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#6c5ce7',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backButton: { fontSize: 24, marginRight: 10, color: '#fff' },
  chatAvatar: { width: 35, height: 35, borderRadius: 18, marginRight: 10 },
  chatTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  messageList: { padding: 15 },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: '#fab1a0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginVertical: 8,
  },
  dateHeaderText: { fontSize: 13, color: '#2d3436' },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 4,
    maxWidth: '75%',
  },
  sent: {
    backgroundColor: '#b2bec3',
    alignSelf: 'flex-end',
  },
  received: {
    backgroundColor: '#ffeaa7',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16, flexShrink: 1 },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: { fontSize: 10, color: '#636e72' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f1f2f6',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#dfe6e9',
    borderRadius: 20,
    fontSize: 16,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#FF7F7F',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

