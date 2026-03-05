// Aggregates all domain-specific styles into a single object
// This file replaces the old styles.js — all imports like `import styles from '../styles'` continue to work
import layoutStyles from './layout';
import commonStyles from './common';
import dashboardStyles from './dashboard';
import plansStyles from './plans';
import usersStyles from './users';
import transactionsStyles from './transactions';
import levelConfigStyles from './levelConfig';
import settingsStyles from './settings';
import networkingStyles from './networking';

const styles = {
    ...layoutStyles,
    ...commonStyles,
    ...dashboardStyles,
    ...plansStyles,
    ...usersStyles,
    ...transactionsStyles,
    ...levelConfigStyles,
    ...settingsStyles,
    // Networking uses object-style (not Tailwind strings), so we nest it
    networking: networkingStyles,
};

export default styles;

// Also export individual style modules for direct imports
export {
    layoutStyles,
    commonStyles,
    dashboardStyles,
    plansStyles,
    usersStyles,
    transactionsStyles,
    levelConfigStyles,
    settingsStyles,
    networkingStyles,
};
