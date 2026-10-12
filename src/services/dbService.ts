import {
  db,
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
  query,
  orderBy,
  runTransaction,
} from '../lib/firebase';
import {
  VideoItem,
  UserProfile,
  DigitalProduct,
  AccountabilityRoom,
  RoomMessage,
  ArenaChallenge,
  ArenaDuel,
  TokenLedgerEntry,
  VaultLock,
  NotificationItem,
  SafetyReport,
  CommentItem,
  LiveStreamItem,
  LiveChatMessage,
} from '../types';

export const dbService = {
  // --- USERS ---
  subscribeUser(userId: string, callback: (user: UserProfile | null) => void) {
    try {
      const userRef = doc(db, 'users', userId);
      return onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data() as UserProfile);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn('[dbService] subscribeUser error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeUser failed to initialize:', e);
      return () => {};
    }
  },

  async saveUser(user: UserProfile) {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user, { merge: true });
    } catch (e) {
      console.warn('[dbService] saveUser error:', e);
    }
  },

  // --- VIDEOS & SHORTS ---
  subscribeVideos(callback: (videos: VideoItem[]) => void) {
    try {
      const vColl = collection(db, 'videos');
      return onSnapshot(
        vColl,
        (snapshot) => {
          const items: VideoItem[] = [];
          snapshot.forEach((d) => items.push(d.data() as VideoItem));
          items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeVideos error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeVideos failed to initialize:', e);
      return () => {};
    }
  },

  async addVideo(video: VideoItem) {
    try {
      const ref = doc(db, 'videos', video.id);
      await setDoc(ref, video);
    } catch (e) {
      console.warn('[dbService] addVideo error:', e);
    }
  },

  async deleteVideo(videoId: string) {
    try {
      const ref = doc(db, 'videos', videoId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('[dbService] deleteVideo error:', e);
    }
  },

  async updateUserAvatarEverywhere(userId: string, newAvatar: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { avatar: newAvatar });

      const vColl = collection(db, 'videos');
      const q = query(vColl, where('creatorId', '==', userId));
      const snaps = await getDocs(q);
      const updates = snaps.docs.map((d) => updateDoc(d.ref, { creatorAvatar: newAvatar }));
      await Promise.all(updates);
    } catch (e) {
      console.warn('[dbService] updateUserAvatarEverywhere error:', e);
    }
  },

  async updateVideoUrl(videoId: string, videoUrl: string) {
    try {
      const ref = doc(db, 'videos', videoId);
      await updateDoc(ref, { videoUrl });
    } catch (e) {
      console.warn('[dbService] updateVideoUrl error:', e);
    }
  },

  async toggleLike(userId: string, videoId: string, isLiked: boolean) {
    try {
      const likeDocId = `${userId}_${videoId}`;
      const likeRef = doc(db, 'likes', likeDocId);
      const videoRef = doc(db, 'videos', videoId);

      await runTransaction(db, async (transaction) => {
        const vSnap = await transaction.get(videoRef);
        if (!vSnap.exists()) return;
        const vData = vSnap.data() as VideoItem;
        const newLikesCount = Math.max(0, (vData.likesCount || 0) + (isLiked ? -1 : 1));

        if (isLiked) {
          transaction.delete(likeRef);
        } else {
          transaction.set(likeRef, {
            userId,
            videoId,
            createdAt: new Date().toISOString(),
          });
        }
        transaction.update(videoRef, { likesCount: newLikesCount });
      });
    } catch (e) {
      console.warn('[dbService] toggleLike error:', e);
    }
  },

  async toggleSave(userId: string, videoId: string, isSaved: boolean) {
    try {
      const saveDocId = `${userId}_${videoId}`;
      const saveRef = doc(db, 'saves', saveDocId);
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          userId,
          videoId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[dbService] toggleSave error:', e);
    }
  },

  subscribeLikes(userId: string, callback: (likedVideoIds: string[]) => void) {
    try {
      const likesRef = collection(db, 'likes');
      return onSnapshot(
        likesRef,
        (snapshot) => {
          const ids: string[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.userId === userId) {
              ids.push(data.videoId);
            }
          });
          callback(ids);
        },
        (error) => {
          console.warn('[dbService] subscribeLikes error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeLikes failed to initialize:', e);
      return () => {};
    }
  },

  subscribeSaves(userId: string, callback: (savedVideoIds: string[]) => void) {
    try {
      const savesRef = collection(db, 'saves');
      return onSnapshot(
        savesRef,
        (snapshot) => {
          const ids: string[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.userId === userId) {
              ids.push(data.videoId);
            }
          });
          callback(ids);
        },
        (error) => {
          console.warn('[dbService] subscribeSaves error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeSaves failed to initialize:', e);
      return () => {};
    }
  },

  // --- COMMENTS ---
  subscribeComments(videoId: string, callback: (comments: CommentItem[]) => void) {
    try {
      const commentsRef = collection(db, 'comments');
      return onSnapshot(
        commentsRef,
        (snapshot) => {
          const items: CommentItem[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as CommentItem;
            if (data.videoId === videoId) {
              items.push(data);
            }
          });
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeComments error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeComments failed to initialize:', e);
      return () => {};
    }
  },

  async addComment(comment: CommentItem) {
    try {
      const ref = doc(db, 'comments', comment.id);
      await setDoc(ref, comment);
    } catch (e) {
      console.warn('[dbService] addComment error:', e);
    }
  },

  // --- ROOMS ---
  subscribeRooms(callback: (rooms: AccountabilityRoom[]) => void) {
    try {
      const roomsRef = collection(db, 'rooms');
      return onSnapshot(
        roomsRef,
        (snapshot) => {
          const items: AccountabilityRoom[] = [];
          snapshot.forEach((d) => items.push(d.data() as AccountabilityRoom));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeRooms error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeRooms failed to initialize:', e);
      return () => {};
    }
  },

  async addRoom(room: AccountabilityRoom) {
    try {
      const ref = doc(db, 'rooms', room.id);
      await setDoc(ref, room);
    } catch (e) {
      console.warn('[dbService] addRoom error:', e);
    }
  },

  subscribeRoomMessages(roomId: string, callback: (messages: RoomMessage[]) => void) {
    try {
      const msgsRef = collection(db, `rooms/${roomId}/messages`);
      return onSnapshot(
        msgsRef,
        (snapshot) => {
          const items: RoomMessage[] = [];
          snapshot.forEach((d) => items.push(d.data() as RoomMessage));
          items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeRoomMessages error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeRoomMessages failed to initialize:', e);
      return () => {};
    }
  },

  async sendRoomMessage(roomId: string, message: RoomMessage) {
    try {
      const ref = doc(db, `rooms/${roomId}/messages`, message.id);
      await setDoc(ref, message);
    } catch (e) {
      console.warn('[dbService] sendRoomMessage error:', e);
    }
  },

  // --- PRODUCTS & COMMERCE ---
  subscribeProducts(callback: (products: DigitalProduct[]) => void) {
    try {
      const pRef = collection(db, 'products');
      return onSnapshot(
        pRef,
        (snapshot) => {
          const items: DigitalProduct[] = [];
          snapshot.forEach((d) => items.push(d.data() as DigitalProduct));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeProducts error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeProducts failed to initialize:', e);
      return () => {};
    }
  },

  async addProduct(product: DigitalProduct) {
    try {
      const ref = doc(db, 'products', product.id);
      await setDoc(ref, product);
    } catch (e) {
      console.warn('[dbService] addProduct error:', e);
    }
  },

  subscribeEntitlements(userId: string, callback: (productIds: string[]) => void) {
    try {
      const eRef = collection(db, 'entitlements');
      return onSnapshot(
        eRef,
        (snapshot) => {
          const ids: string[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.buyerId === userId) {
              ids.push(data.productId);
            }
          });
          callback(ids);
        },
        (error) => {
          console.warn('[dbService] subscribeEntitlements error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeEntitlements failed to initialize:', e);
      return () => {};
    }
  },

  async buyProduct(
    buyer: UserProfile,
    product: DigitalProduct,
    idempotencyKey: string
  ): Promise<{ success: boolean; message: string }> {
    if (buyer.tokens < product.priceTokens) {
      return {
        success: false,
        message: `Insufficient balance. Need ${product.priceTokens} RUP, but you hold ${buyer.tokens} RUP.`,
      };
    }

    const orderId = `ord_${Date.now()}`;
    const entitlementId = `ent_${buyer.id}_${product.id}`;
    const ledgerId = `tx_${Date.now()}`;

    const userRef = doc(db, 'users', buyer.id);
    const orderRef = doc(db, 'orders', orderId);
    const entitlementRef = doc(db, 'entitlements', entitlementId);
    const ledgerRef = doc(db, 'token_ledger', ledgerId);
    const productRef = doc(db, 'products', product.id);

    try {
      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(userRef);
        const currentTokens = uSnap.exists() ? (uSnap.data().tokens || 0) : buyer.tokens;
        if (currentTokens < product.priceTokens) {
          throw new Error('Insufficient tokens');
        }

        transaction.update(userRef, { tokens: currentTokens - product.priceTokens });
        transaction.set(orderRef, {
          id: orderId,
          buyerId: buyer.id,
          sellerId: product.creatorId,
          productId: product.id,
          productTitle: product.title,
          priceTokens: product.priceTokens,
          idempotencyKey,
          createdAt: new Date().toISOString(),
        });
        transaction.set(entitlementRef, {
          id: entitlementId,
          buyerId: buyer.id,
          productId: product.id,
          orderId,
          grantedAt: new Date().toISOString(),
        });
        transaction.set(ledgerRef, {
          id: ledgerId,
          userId: buyer.id,
          delta: -product.priceTokens,
          type: 'Purchase',
          description: `Acquired code asset: ${product.title}`,
          idempotencyKey,
          createdAt: new Date().toISOString(),
        });
        transaction.update(productRef, {
          salesCount: (product.salesCount || 0) + 1,
        });
      });

      return {
        success: true,
        message: `Successfully acquired "${product.title}". Entitlement granted.`,
      };
    } catch (e: any) {
      console.warn('[dbService] buyProduct transaction error:', e);
      return {
        success: false,
        message: e?.message || 'Transaction failed',
      };
    }
  },

  // --- TOKEN LEDGER & VAULT ---
  subscribeLedger(userId: string, callback: (entries: TokenLedgerEntry[]) => void) {
    try {
      const lRef = collection(db, 'token_ledger');
      return onSnapshot(
        lRef,
        (snapshot) => {
          const items: TokenLedgerEntry[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as TokenLedgerEntry;
            if (data.userId === userId) {
              items.push(data);
            }
          });
          items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeLedger error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeLedger failed to initialize:', e);
      return () => {};
    }
  },

  subscribeVaultLocks(userId: string, callback: (locks: VaultLock[]) => void) {
    try {
      const vRef = collection(db, 'vault_locks');
      return onSnapshot(
        vRef,
        (snapshot) => {
          const items: VaultLock[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as VaultLock;
            if (data.userId === userId) {
              items.push(data);
            }
          });
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeVaultLocks error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeVaultLocks failed to initialize:', e);
      return () => {};
    }
  },

  async addLedgerEntry(entry: TokenLedgerEntry) {
    try {
      const ref = doc(db, 'token_ledger', entry.id);
      await setDoc(ref, entry);
    } catch (e) {
      console.warn('[dbService] addLedgerEntry error:', e);
    }
  },

  async createVaultLock(userId: string, lock: VaultLock, deltaTokens: number) {
    try {
      const lockRef = doc(db, 'vault_locks', lock.id);
      const ledgerRef = doc(db, 'token_ledger', `tx_vault_${Date.now()}`);
      const userRef = doc(db, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(userRef);
        if (!uSnap.exists()) return;
        const uData = uSnap.data();
        const currentTokens = uData.tokens || 0;
        const currentLocked = uData.lockedTokens || 0;

        transaction.update(userRef, {
          tokens: currentTokens - deltaTokens,
          lockedTokens: currentLocked + deltaTokens,
        });

        transaction.set(lockRef, lock);
        transaction.set(ledgerRef, {
          id: `tx_vault_${Date.now()}`,
          userId,
          delta: -deltaTokens,
          type: 'Vault Lock',
          description: `Locked ${deltaTokens} RUP for ${lock.termDays} days (${lock.rewardMultiplier}x yield)`,
          idempotencyKey: `vault_lock_${lock.id}`,
          createdAt: new Date().toISOString(),
        });
      });
    } catch (e) {
      console.warn('[dbService] createVaultLock error:', e);
    }
  },

  // --- ARENA ---
  subscribeChallenges(callback: (challenges: ArenaChallenge[]) => void) {
    try {
      const cRef = collection(db, 'challenges');
      return onSnapshot(
        cRef,
        (snapshot) => {
          const items: ArenaChallenge[] = [];
          snapshot.forEach((d) => items.push(d.data() as ArenaChallenge));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeChallenges error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeChallenges failed to initialize:', e);
      return () => {};
    }
  },

  subscribeDuels(callback: (duels: ArenaDuel[]) => void) {
    try {
      const dRef = collection(db, 'duels');
      return onSnapshot(
        dRef,
        (snapshot) => {
          const items: ArenaDuel[] = [];
          snapshot.forEach((d) => items.push(d.data() as ArenaDuel));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeDuels error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeDuels failed to initialize:', e);
      return () => {};
    }
  },

  async addDuel(duel: ArenaDuel) {
    try {
      const ref = doc(db, 'duels', duel.id);
      await setDoc(ref, duel);
    } catch (e) {
      console.warn('[dbService] addDuel error:', e);
    }
  },

  // --- NOTIFICATIONS ---
  subscribeNotifications(userId: string, callback: (notifications: NotificationItem[]) => void) {
    try {
      const nRef = collection(db, 'notifications');
      return onSnapshot(
        nRef,
        (snapshot) => {
          const items: NotificationItem[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as NotificationItem;
            if (data.recipientId === userId) {
              items.push(data);
            }
          });
          items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeNotifications error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeNotifications failed to initialize:', e);
      return () => {};
    }
  },

  async markNotificationRead(id: string) {
    try {
      const ref = doc(db, 'notifications', id);
      await updateDoc(ref, { read: true });
    } catch (e) {
      console.warn('[dbService] markNotificationRead error:', e);
    }
  },

  async addNotification(notif: NotificationItem) {
    try {
      const ref = doc(db, 'notifications', notif.id);
      await setDoc(ref, notif);
    } catch (e) {
      console.warn('[dbService] addNotification error:', e);
    }
  },

  // --- REPORTS ---
  async addReport(report: SafetyReport) {
    try {
      const ref = doc(db, 'reports', report.id);
      await setDoc(ref, report);
    } catch (e) {
      console.warn('[dbService] addReport error:', e);
    }
  },

  // --- LIVE STREAMS & LIVE CHAT (DIRECT DEVICE WEBRTC & REALTIME CHAT) ---
  subscribeLiveStreams(callback: (streams: LiveStreamItem[]) => void) {
    try {
      const sRef = collection(db, 'livestreams');
      return onSnapshot(
        sRef,
        (snapshot) => {
          const items: LiveStreamItem[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as LiveStreamItem;
            if (data.isLive) {
              items.push(data);
            }
          });
          items.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeLiveStreams error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeLiveStreams failed to initialize:', e);
      return () => {};
    }
  },

  async saveLiveStream(stream: LiveStreamItem) {
    try {
      const ref = doc(db, 'livestreams', stream.id);
      await setDoc(ref, stream, { merge: true });
    } catch (e) {
      console.warn('[dbService] saveLiveStream error:', e);
    }
  },

  async updateLiveStreamStatus(streamId: string, isLive: boolean) {
    try {
      const ref = doc(db, 'livestreams', streamId);
      await updateDoc(ref, { isLive });
    } catch (e) {
      console.warn('[dbService] updateLiveStreamStatus error:', e);
    }
  },

  subscribeLiveChat(streamId: string, callback: (messages: LiveChatMessage[]) => void) {
    try {
      const cRef = collection(db, 'livechat');
      return onSnapshot(
        cRef,
        (snapshot) => {
          const items: LiveChatMessage[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as LiveChatMessage;
            if (data.streamId === streamId) {
              items.push(data);
            }
          });
          items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          callback(items);
        },
        (error) => {
          console.warn('[dbService] subscribeLiveChat error:', error?.message);
        }
      );
    } catch (e) {
      console.warn('[dbService] subscribeLiveChat failed:', e);
      return () => {};
    }
  },

  async sendLiveChatMessage(message: LiveChatMessage) {
    try {
      const ref = doc(db, 'livechat', message.id);
      await setDoc(ref, message);
    } catch (e) {
      console.warn('[dbService] sendLiveChatMessage error:', e);
    }
  },
};
