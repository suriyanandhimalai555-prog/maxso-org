// Layout styles: App wrapper, Sidebar, Navbar, Auth pages
const layoutStyles = {
    // App Layout
    appWrapper: "min-h-screen bg-[#0d0d0d] text-gray-300 font-sans flex relative overflow-hidden",
    mainContent: "flex-1 flex flex-col min-w-0 transition-all duration-300 bg-[#0d0d0d] h-screen overflow-y-auto",
    pageContainer: "p-4 md:p-6",

    // Auth Layout
    authContainer: "flex items-center justify-center min-h-screen bg-[#0d0d0d] w-full",
    authCard: "w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl p-8 space-y-6",

    // Sidebar
    sidebarContainer: "fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#8b0000] to-[#2b0000] min-h-screen flex flex-col text-white transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-40 md:relative",
    sidebarOverlay: "fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300",
    sidebarLogoWrapper: "h-20 flex items-center justify-start px-6 border-b border-red-900/50 mb-4",
    sidebarLogo: "bg-gradient-to-br from-red-500 to-red-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-2xl italic shadow-lg shadow-red-900/50 mr-3",
    sidebarNav: "flex-1 px-4 space-y-2",
    sidebarLink: "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-red-900/40 text-red-100",
    sidebarLinkActive: "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-red-900/80 text-white shadow-inner border-l-4 border-white",
    sidebarSubmenu: "pl-12 pr-4 py-2 space-y-2",
    sidebarSubLink: "block text-sm text-red-200 hover:text-white transition-colors py-1 flex items-center gap-2",
    sidebarSubLinkActive: "block text-sm text-white font-semibold flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-white before:rounded-full py-1",

    // Navbar
    navHeader: "bg-[#0d0d0d] border-b border-[#222222] sticky top-0 z-10",
    navContainer: "h-20 px-6 flex items-center justify-between",
    navLeft: "flex items-center gap-4",
    navHamburger: "text-[#b30000] p-2 hover:bg-[#1a1a1a] rounded cursor-pointer transition-colors",
    navHeaderTitleBox: "flex flex-col justify-center min-w-0 flex-1 flex",
    navHeaderTitle: "text-xl md:text-2xl font-bold text-[#b30000] tracking-wide truncate",
    navHeaderSubtitle: "text-xs text-white font-bold flex items-center gap-1",
    navRight: "flex items-center gap-4 md:gap-6",
    walletBox: "flex flex-col items-end justify-center hidden sm:flex truncate",
    walletLabel: "text-[10px] md:text-xs text-gray-400 capitalize",
    walletAmount: "text-sm md:text-base font-bold text-[#b30000]",
    avatarBox: "relative",
    avatarImage: "w-10 h-10 rounded-full border-2 border-[#b30000] cursor-pointer object-cover",
    dropdownMenu: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-50",
    dropdownHeader: "px-4 py-3 text-sm font-bold text-gray-900 border-b",
    dropdownItem: "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer",
    navSignupButton: "px-4 py-2 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors shadow-sm",
    navLogoIcon: "bg-gradient-to-br from-red-500 to-red-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-2xl italic shadow-lg shadow-red-900/50",
    navLogoText: "text-2xl font-bold tracking-tight text-white hover:text-red-500 transition-colors mr-2",
};

export default layoutStyles;
