// Transaction page styles
const transactionsStyles = {
    transactionContainer: "",
    transactionHeader: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    transactionHeaderLeft: "flex items-center gap-4",
    transactionTitle: "text-2xl font-bold text-white",

    transactionTabContainer: "flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-[#333]",
    transactionTabButton: "px-4 py-2 rounded-md text-sm font-medium transition-all",
    transactionTabActive: "bg-red-700 text-white shadow-lg",
    transactionTabInactive: "text-gray-400 hover:text-white hover:bg-[#1a1a1a]",

    transactionTableWrapper: "relative overflow-x-auto shadow-2xl rounded-lg border border-[#222222] bg-[#111111]",
    transactionSearchHeader: "p-4 border-b border-[#222222] flex items-center justify-between",
    transactionTable: "w-full text-sm text-left text-gray-300",
    transactionThead: "text-xs text-white uppercase bg-[#8b0000] border-b border-[#222222]",
    transactionTh: "px-6 py-4 font-semibold tracking-wider",
    transactionTr: "bg-[#0d0d0d] border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors",
    transactionTd: "px-6 py-4",
    transactionTdBold: "px-6 py-4 font-medium text-white",

    transactionHash: "font-mono text-xs",
    transactionPlanBadge: "bg-[#1a1a1a] px-2 py-1 rounded text-xs border border-[#333]",
    transactionAmount: "text-green-500 font-semibold",
    transactionType: "text-xs",
    transactionStatus: "bg-green-900/30 text-green-400 border border-green-800/50 px-2 py-1 rounded text-xs font-semibold",

    transactionActionCell: "px-6 py-4 text-center",
    transactionActionButton: "text-gray-400 hover:text-white transition-colors",
    transactionActionIcon: "w-5 h-5",

    transactionNoData: "py-8 text-center text-gray-500",
};

export default transactionsStyles;
