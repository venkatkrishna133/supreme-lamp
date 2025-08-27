const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.notifyNewMessage = functions.firestore
  .document('chats/{chatId}')
  .onWrite(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data() || {};
    if (!after) return null;

    const messages = after.messages || [];
    const prevMessages = before.messages || [];
    if (!messages.length) return null;

    const latestMessage = messages[0];
    if (prevMessages[0] && prevMessages[0]._id === latestMessage._id) {
      return null;
    }

    const senderEmail = latestMessage.user._id;

    const userDocs = await Promise.all(
      (after.users || []).map((u) =>
        admin.firestore().doc(`users/${u.email}`).get()
      )
    );

    const tokens = [];
    userDocs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.pushToken && data.email !== senderEmail) {
        tokens.push(data.pushToken);
      }
    });

    if (!tokens.length) return null;

    const chatName =
      after.groupName ||
      (after.users || []).find((u) => u.email !== senderEmail)?.name ||
      'Chat';

    const payload = {
      tokens,
      notification: {
        title: chatName,
        body: 'New message',
      },
      data: {
        chatId: context.params.chatId,
        chatName,
      },
    };

    await admin.messaging().sendEachForMulticast(payload);
    return null;
  });

