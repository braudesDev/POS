import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from '@angular/fire/auth';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  // Observable del usuario actual (reactivo)
  user$: Observable<User | null> = authState(this.auth);

  // Observable derivado: true si está autenticado
  isAuthenticated$ = this.user$.pipe(map((user) => !!user));

  /**
   * Iniciar sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      return credential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }

      return credential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Iniciar sesión con Google
   */
  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Recuperar contraseña
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Obtener usuario actual (no observable)
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Manejo de errores amigable
   */
  private handleAuthError(error: any): Error {
    let message = 'Error de autenticación';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/email-already-in-use':
        message = 'El email ya está registrado';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Ventana de autenticación cerrada';
        break;
      default:
        message = error.message;
    }

    return new Error(message);
  }
}
