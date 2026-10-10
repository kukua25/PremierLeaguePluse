import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  const { signup, login, resendVerificationEmail } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !confirmPassword)) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    let result;
    if (isSignup) {
      result = await signup(email, password);

      if (result.success) {
        showAlert(
          'Success!',
          result.message || 'Account created! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsSignup(false);
                setPassword('');
                setConfirmPassword('');
              }
            }
          ]
        );
      }
    } else {
      result = await login(email, password);

      if (result.needsVerification) {
        setShowResendVerification(true);
      }
    }

    setLoading(false);

    if (!result.success && !result.needsVerification) {
      showAlert('Error', result.error);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    const result = await resendVerificationEmail();
    setLoading(false);

    if (result.success) {
      showAlert('Success', result.message);
      setShowResendVerification(false);
    } else {
      showAlert('Error', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>⚽ Premier League Pulse</Text>
        <Text style={styles.subtitle}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>

        <View style={styles.inputRow}>
          <Feather name="mail" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {isSignup && (
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
        )}

        {showResendVerification && (
          <View style={styles.verificationBox}>
            <Text style={styles.verificationText}>
              Email not verified. Please check your inbox.
            </Text>
            <TouchableOpacity onPress={handleResendVerification}>
              <Text style={styles.resendText}>Resend Verification Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignup ? 'Sign Up' : 'Log In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsSignup(!isSignup);
            setShowResendVerification(false);
            setConfirmPassword('');
          }}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignup
              ? 'Already have an account? Log In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38003c',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#38003c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#38003c',
    fontSize: 15,
  },
  verificationBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  verificationText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 8,
  },
  resendText: {
    color: '#38003c',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
