// Common/shared styles: Forms, Buttons, Search, Pagination, Modals, Table foundations
const commonStyles = {
    // Forms
    formHeading: "text-3xl font-extrabold text-white text-center mb-6",
    label: "block text-sm font-medium text-gray-300 mb-1",
    inputBase: "w-full px-4 py-2 bg-[#1a1a1a] text-white border rounded-lg focus:ring-2 outline-none transition-all placeholder-gray-600",
    inputNormal: "focus:ring-red-500/50 focus:border-red-500 border-[#333333]",
    inputError: "focus:ring-red-500 focus:border-red-500 border-red-500",
    errorContainer: "mt-4 p-4 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg text-sm text-center",

    // Buttons
    primaryButton: "w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg shadow-red-900/20",
    secondaryButton: "px-4 py-2 text-sm font-semibold text-gray-300 border border-[#333333] hover:bg-[#1a1a1a] hover:text-white rounded-lg transition-colors",
    outlineButton: "px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors",
    actionButton: "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-700 hover:bg-red-600 transition-colors shadow-sm shadow-red-900/20",
    iconButton: "p-2 hover:bg-[#222] rounded-full transition-colors text-gray-400 hover:text-white",

    // Search
    searchIcon: "w-5 h-5 text-gray-400",
    searchWrapper: "flex items-center bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 w-full max-w-sm focus-within:border-red-500 transition-colors",
    searchInput: "bg-transparent outline-none text-white px-2 py-1 w-full placeholder-gray-500 text-sm",

    // Pagination
    paginationContainer: "flex items-center justify-between mt-4 py-3 text-sm text-gray-400",
    paginationButton: "px-4 py-2 bg-[#8b0000] text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed",
    paginationActive: "bg-white text-black font-bold w-8 h-8 rounded-full flex items-center justify-center mx-1 shadow-md",
    paginationInactive: "w-8 h-8 rounded-full flex items-center justify-center mx-1 hover:bg-[#222222] transition-colors cursor-pointer text-red-500 font-medium whitespace-nowrap",
    paginationRowsWrapper: "flex items-center gap-2",
    paginationRowsInner: "flex items-center gap-2",
    paginationRowsLabel: "text-sm text-gray-400",
    paginationControls: "flex items-center gap-1",
    paginationIcon: "w-4 h-4",
    paginationNumbers: "flex items-center mx-2",
    rowsSelect: "bg-[#111111] text-white border border-[#2a2a2a] rounded-md px-2 py-1 outline-none focus:border-red-500 text-sm",

    // Switch
    switchWrapper: "relative inline-flex items-center cursor-pointer",
    switchInput: "sr-only peer",
    switchBg: "w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500",

    // Role Badges
    umRoleBadgeBase: "px-2 py-1 rounded text-xs font-semibold border",
    umRoleAdmin: "bg-purple-900/30 text-purple-400 border-purple-800/50",
    umRoleUser: "bg-green-900/30 text-green-400 border-green-800/50",

    // Loading / Error states
    umLoading: "p-8 text-center text-gray-500",
    umError: "p-8 text-center text-red-500 font-semibold",

    // Misc
    homeCard: "bg-[#111111] rounded-xl shadow-lg p-8 max-w-2xl mx-auto mt-8 border border-[#222222]",
    homeGreeting: "text-3xl font-bold text-white mb-4",
    homeEmail: "text-red-500",
    homeText: "text-gray-400 text-lg mb-6",
    homeAdminSection: "mt-8 pt-6 border-t border-[#333333]",
    homeAdminHeading: "text-xl font-semibold mb-4 text-white",
    testBanner: "hidden",
    testBannerHeading: "hidden",
    testBannerText: "hidden",

    // Shared animations
    animations: `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
    `,
};

export default commonStyles;
