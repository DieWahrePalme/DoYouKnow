import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/state/appStore';
import { UserProfile } from '@/types';

export interface IncomingRequest {
  friendshipId: string;
  from: UserProfile;
}

interface ProfileRow {
  id: string;
  username: string;
  avatar_emoji: string;
}

function toUserProfile(row: ProfileRow): UserProfile {
  return { id: row.id, name: row.username, avatarEmoji: row.avatar_emoji };
}

interface FriendsState {
  incomingRequests: IncomingRequest[];
  outgoingPendingIds: string[];
  searchResults: UserProfile[];
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  sendRequest: (targetUserId: string) => Promise<{ error: string | null }>;
  acceptRequest: (request: IncomingRequest) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  incomingRequests: [],
  outgoingPendingIds: [],
  searchResults: [],
  searchLoading: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    const myId = useAppStore.getState().activeUserId;
    if (!myId) return;
    set({ loading: true, error: null });

    const [{ data: incomingRows, error: incomingError }, { data: outgoingRows }, { data: acceptedRows }] = await Promise.all([
      supabase.from('friendships').select('id, user_id').eq('friend_id', myId).eq('status', 'pending'),
      supabase.from('friendships').select('friend_id').eq('user_id', myId).eq('status', 'pending'),
      supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${myId},friend_id.eq.${myId}`),
    ]);

    if (incomingError) {
      set({ loading: false, error: incomingError.message });
      return;
    }

    const senderIds = (incomingRows ?? []).map((r) => r.user_id);
    const acceptedFriendIds = (acceptedRows ?? []).map((r) => (r.user_id === myId ? r.friend_id : r.user_id));
    const allProfileIds = Array.from(new Set([...senderIds, ...acceptedFriendIds]));

    let profilesById: Record<string, ProfileRow> = {};
    if (allProfileIds.length > 0) {
      const { data: profileRows } = await supabase.from('profiles').select('id, username, avatar_emoji').in('id', allProfileIds);
      profilesById = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p]));
    }

    const incomingRequests: IncomingRequest[] = (incomingRows ?? [])
      .filter((r) => profilesById[r.user_id])
      .map((r) => ({ friendshipId: r.id, from: toUserProfile(profilesById[r.user_id]) }));

    for (const friendId of acceptedFriendIds) {
      const row = profilesById[friendId];
      if (row) useAppStore.getState().mergeRealFriend(toUserProfile(row));
    }

    set({
      incomingRequests,
      outgoingPendingIds: (outgoingRows ?? []).map((r) => r.friend_id),
      loading: false,
    });

    void useAppStore.getState().loadCloudData();
  },

  searchUsers: async (query) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      set({ searchResults: [] });
      return;
    }
    set({ searchLoading: true });
    const myId = useAppStore.getState().activeUserId;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_emoji')
      .ilike('username', `%${trimmed}%`)
      .neq('id', myId)
      .limit(15);
    set({
      searchResults: error ? [] : (data ?? []).map(toUserProfile),
      searchLoading: false,
      error: error?.message ?? null,
    });
  },

  clearSearch: () => set({ searchResults: [] }),

  sendRequest: async (targetUserId) => {
    const myId = useAppStore.getState().activeUserId;

    // If the other person already sent me a request, sending one back just accepts theirs.
    const { data: reverseRow } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('friend_id', myId)
      .eq('status', 'pending')
      .maybeSingle();

    if (reverseRow) {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji')
        .eq('id', targetUserId)
        .single();
      await get().acceptRequest({ friendshipId: reverseRow.id, from: toUserProfile(targetProfile as ProfileRow) });
      return { error: null };
    }

    const { error } = await supabase.from('friendships').insert({ user_id: myId, friend_id: targetUserId, status: 'pending' });
    if (error) {
      const message = error.message.includes('duplicate key') ? 'Anfrage wurde schon gesendet.' : error.message;
      set({ error: message });
      return { error: message };
    }
    set((state) => ({ outgoingPendingIds: [...state.outgoingPendingIds, targetUserId] }));
    return { error: null };
  },

  acceptRequest: async (request) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', request.friendshipId);
    useAppStore.getState().mergeRealFriend(request.from);
    set((state) => ({ incomingRequests: state.incomingRequests.filter((r) => r.friendshipId !== request.friendshipId) }));
    void useAppStore.getState().loadCloudData();
  },

  declineRequest: async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    set((state) => ({ incomingRequests: state.incomingRequests.filter((r) => r.friendshipId !== friendshipId) }));
  },

  removeFriend: async (friendId) => {
    const myId = useAppStore.getState().activeUserId;
    // No-ops harmlessly for the demo NPC friends, which have no backing row.
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${myId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${myId})`);
    useAppStore.getState().removeFriendFromUsers(friendId);
  },
}));
