import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email } },
      });
      if (err) throw err;
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <View style={{ padding: 16, gap: 12, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: '800' }}>
          Create account
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
          After signup, set your role to seller in Supabase (see README).
        </Text>

        <View style={{ gap: 10, marginTop: 10 }}>
          <TextInput
            placeholder="Store / Owner name"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={name}
            onChangeText={setName}
            style={{
              color: 'white',
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.45)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              color: 'white',
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.45)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              color: 'white',
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          />
        </View>

        {error ? (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,77,79,0.4)',
              backgroundColor: 'rgba(255,77,79,0.12)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={signUp}
          disabled={loading}
          style={{
            marginTop: 6,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: '#2F80FF',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>
            {loading ? 'Please wait…' : 'Register'}
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Back to login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

