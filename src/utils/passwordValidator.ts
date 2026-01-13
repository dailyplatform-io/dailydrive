export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  // Minimum 8 characters, at least one uppercase, one lowercase, and one number
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  return { isValid: true }
}

// Legacy PasswordValidator for backward compatibility
export const PasswordValidator = {
  requirements: {
    minimumLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
  },

  validatePassword(password: string): PasswordValidationResult {
    return validatePassword(password);
  },

  getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
    let score = 0;
    
    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special characters

    if (score < 3) return 'weak';
    if (score < 4) return 'fair';
    if (score < 5) return 'good';
    return 'strong';
  },

  getPasswordRequirementsList(): string[] {
    return [
      `At least ${this.requirements.minimumLength} characters`,
      'At least one uppercase letter (A-Z)',
      'At least one lowercase letter (a-z)',
      'At least one number (0-9)',
    ];
  },
};