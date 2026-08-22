// Owner Permission Mappings
// Defines which owners can see other owners' data

const OWNER_PERMISSIONS = {
    'Yura@owner.com': ['Faker@owner.com', '0xGiant@owner.com'],
    'Rape@owner.com': ['0xStrong@owner.com', 'Voldmot@owner.com']
}

/**
 * Get accessible owner emails for a given user
 * @param {Object} user - The current user object
 * @returns {Array} - Array of owner emails that the user can access (including their own)
 */
export const getAccessibleOwnerEmails = (user) => {
    if (!user) return []
    
    // Admin can see all owners
    if (user.role === 'admin') {
        return [] // Return empty array to indicate no restrictions (all owners)
    }
    
    const userEmail = user.email
    const accessibleEmails = [userEmail] // Always include own email
    
    // Add permitted emails if they exist
    if (OWNER_PERMISSIONS[userEmail]) {
        accessibleEmails.push(...OWNER_PERMISSIONS[userEmail])
    }
    
    return accessibleEmails
}

/**
 * Get accessible owner IDs for a given user
 * @param {Object} user - The current user object
 * @param {Array} allOwners - Array of all owner objects with id, email, name
 * @returns {Array} - Array of owner IDs that the user can access
 */
export const getAccessibleOwnerIds = (user, allOwners) => {
    if (!user || !allOwners) return []
    
    // Admin can see all owners
    if (user.role === 'admin') {
        return allOwners.map(owner => owner.id)
    }
    
    const accessibleEmails = getAccessibleOwnerEmails(user)
    const accessibleOwners = allOwners.filter(owner => accessibleEmails.includes(owner.email))
    
    return accessibleOwners.map(owner => owner.id)
}

/**
 * Check if a user can access data for a specific owner ID
 * @param {Object} user - The current user object
 * @param {string} targetOwnerId - The owner ID to check access for
 * @param {Array} allOwners - Array of all owner objects
 * @returns {boolean} - Whether the user can access the target owner's data
 */
export const canAccessOwnerData = (user, targetOwnerId, allOwners) => {
    if (!user || !targetOwnerId || !allOwners) return false
    
    // Admin can access all data
    if (user.role === 'admin') return true
    
    const accessibleIds = getAccessibleOwnerIds(user, allOwners)
    return accessibleIds.includes(targetOwnerId)
}

export default {
    getAccessibleOwnerEmails,
    getAccessibleOwnerIds,
    canAccessOwnerData,
    OWNER_PERMISSIONS
}