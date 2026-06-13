import { useCallback, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Check, Copy, Send, Trash2, Users } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";

import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import {
  acceptFriendship,
  createFriendshipByCode,
  deleteFriendship,
  listFriendships,
  loadMyProfile
} from "@/services/friends";
import type { Friendship, Profile } from "@/types/database";
import { shortId } from "@/utils/date";

export default function SocialScreen() {
  const c = useColors();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [profileData, friendshipData] = await Promise.all([loadMyProfile(), listFriendships()]);
      setProfile(profileData);
      setFriendships(friendshipData);
    } catch (error) {
      setNotice(String((error as { message?: string })?.message ?? "Unable to load social data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function copyInvite() {
    if (!profile) {
      return;
    }

    await Clipboard.setStringAsync(Linking.createURL(`/friend/${profile.invite_code}`));
    setNotice("Invite link copied.");
  }

  async function sendRequest() {
    setLoading(true);
    setNotice(null);
    try {
      await createFriendshipByCode(code);
      setCode("");
      setNotice("Friend request sent.");
      await load();
    } catch (error) {
      setNotice(String((error as { message?: string })?.message ?? "Unable to send request."));
    } finally {
      setLoading(false);
    }
  }

  async function accept(friendship: Friendship) {
    await acceptFriendship(friendship);
    await load();
  }

  async function remove(friendship: Friendship) {
    await deleteFriendship(friendship.id);
    await load();
  }

  return (
    <Screen eyebrow="Friends and sharing" onRefresh={load} refreshing={loading} title="Social">
      <View className="gap-4">
        <View className="items-center gap-4 rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          {profile ? (
            <QRCode
              backgroundColor={c.surface}
              color={c.ink}
              size={168}
              value={Linking.createURL(`/friend/${profile.invite_code}`)}
            />
          ) : null}
          <View className="items-center">
            <Text className="text-[13px] font-medium" style={{ color: c.muted }}>Friend code</Text>
            <Text className="mt-1 text-[28px] font-semibold tracking-[2px]" style={{ color: c.ink }}>{profile?.invite_code ?? "..."}</Text>
          </View>
          <PrimaryButton icon={<Copy color="white" size={18} />} label="Copy invite" onPress={copyInvite} />
        </View>

        <View className="gap-3 rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          <TextInput
            autoCapitalize="characters"
            className="h-12 rounded-md border px-4 text-[16px]" style={{ borderColor: c.line, backgroundColor: c.surface, color: c.ink }}
            onChangeText={setCode}
            placeholder="Enter friend code"
            placeholderTextColor="#8B948F"
            value={code}
          />
          <PrimaryButton
            disabled={!code.trim()}
            icon={<Send color="white" size={18} />}
            label="Send request"
            loading={loading}
            onPress={sendRequest}
          />
        </View>

        <View className="gap-3">
          {friendships.length === 0 && !loading ? (
            <View className="items-center gap-4 py-8">
              <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#2563EB" + "20" }}>
                <Users color="#2563EB" size={28} />
              </View>
              <Text className="text-center text-[15px] font-semibold" style={{ color: c.ink }}>No friends yet</Text>
              <Text className="text-center text-[13px] leading-5" style={{ color: c.muted }}>
                Share your invite code or enter a friend's{'\n'}code above to get started.
              </Text>
            </View>
          ) : null}
          {friendships.map((friendship) => {
            const otherId = friendship.requester_id === profile?.id ? friendship.addressee_id : friendship.requester_id;
            const canAccept = friendship.addressee_id === profile?.id && friendship.status === "pending";

            return (
              <View key={friendship.id} className="rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Link href={`/profile/${otherId}`}>
                      <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>{shortId(otherId)}</Text>
                    </Link>
                    <Text className="mt-1 text-[13px] capitalize" style={{ color: c.muted }}>{friendship.status}</Text>
                  </View>
                  {canAccept ? (
                    <PrimaryButton icon={<Check color="white" size={18} />} label="Accept" onPress={() => accept(friendship)} />
                  ) : (
                    <PrimaryButton
                      icon={<Trash2 color={c.ink} size={18} />}
                      label="Remove"
                      onPress={() => remove(friendship)}
                      variant="quiet"
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {notice ? <Text className="text-[13px] font-medium" style={{ color: c.success }}>{notice}</Text> : null}
      </View>
    </Screen>
  );
}
