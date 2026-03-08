// Coupon validation system — uses Firestore for code storage.
// Free: no external payment gateway coupon APIs needed.

import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Coupon {
    code: string;
    discountPercent: number;
    expiresAt: string; // ISO date
    maxUses: number;
    usedCount: number;
    description?: string;
    /** Which plans this coupon applies to */
    validPlans?: string[];
}

export interface CouponResult {
    valid: boolean;
    coupon?: Coupon;
    error?: string;
}

/**
 * Validate a coupon code against Firestore.
 * Returns the coupon details if valid, or an error message if invalid.
 */
export async function validateCoupon(code: string): Promise<CouponResult> {
    if (!code || code.trim().length < 3) {
        return { valid: false, error: 'Invalid coupon code' };
    }

    const normalizedCode = code.trim().toUpperCase();

    try {
        const couponDoc = doc(db, 'coupons', normalizedCode);
        const snap = await getDoc(couponDoc);

        if (!snap.exists()) {
            return { valid: false, error: 'Coupon not found' };
        }

        const coupon = snap.data() as Coupon;

        // Check expiry
        if (new Date(coupon.expiresAt) < new Date()) {
            return { valid: false, error: 'This coupon has expired' };
        }

        // Check max uses
        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            return { valid: false, error: 'This coupon has been fully redeemed' };
        }

        return { valid: true, coupon: { ...coupon, code: normalizedCode } };
    } catch {
        return { valid: false, error: 'Failed to validate coupon' };
    }
}

/**
 * Apply a coupon — increments the usage count in Firestore.
 * Call this AFTER successful payment.
 */
export async function applyCoupon(code: string, userId: string): Promise<boolean> {
    try {
        const normalizedCode = code.trim().toUpperCase();
        const couponDoc = doc(db, 'coupons', normalizedCode);
        await updateDoc(couponDoc, {
            usedCount: increment(1),
        });
        return true;
    } catch {
        console.error('Failed to apply coupon');
        return false;
    }
}

/**
 * Calculate the discounted price.
 */
export function calculateDiscount(originalPrice: number, discountPercent: number): number {
    return Math.round(originalPrice * (1 - discountPercent / 100));
}
