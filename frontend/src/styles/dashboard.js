// Dashboard-specific styles
const dashboardStyles = {
    dashUsersBlock: "bg-gradient-to-br from-[#800000] to-[#3a0000] rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden",
    dashUserCard: "bg-[#0f0a0a] border border-[#221010] transform -skew-x-6 px-10 py-6 flex flex-col items-center justify-center flex-1 w-full shadow-lg relative min-w-[140px]",
    dashUserCardContent: "transform skew-x-6 flex flex-col items-center",
    dashUserLabel: "text-[10px] md:text-xs font-bold text-white uppercase tracking-widest mb-2",
    dashUserValue: "text-3xl font-black text-white",

    dashSectionTitle: "text-sm font-bold text-white uppercase tracking-widest mb-4",

    dashWalletContainer: "grid grid-cols-1 md:grid-cols-3 gap-6",
    dashWalletCard: "bg-black border border-red-900/40 rounded-xl p-6 flex flex-col shadow-[0_4px_24px_rgba(139,0,0,0.1)]",
    dashWalletHeader: "flex justify-between items-start mb-6",
    dashWalletLabel: "text-xs font-bold text-white capitalize",
    dashWalletIcon: "text-white w-5 h-5",
    dashWalletValue: "text-2xl font-black text-white mt-auto",

    dashOverviewContainer: "grid grid-cols-1 lg:grid-cols-2 gap-8",
    dashListCard: "bg-black border border-[#1a1a1a] rounded-xl p-0 flex flex-col overflow-hidden",
    dashListItem: "p-6 flex items-center justify-between border-b border-[#222] last:border-b-0",
    dashListLeft: "flex items-center gap-4",
    dashListIconBox: "w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]",
    dashListIcon: "text-gray-400 w-5 h-5",
    dashListText: "flex flex-col",
    dashListLabel: "text-[10px] uppercase font-bold text-gray-400 tracking-wider",
    dashListValue: "text-sm font-bold text-white mt-1",
};

export default dashboardStyles;
