function Footer() {
    return (
        <footer className="bg-gray-100 border-t border-gray-300 py-4 px-6 z-10">
            <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">© {new Date().getFullYear()} INOPS. All rights reserved.</p>
                <p className="text-xs text-gray-500">Application Management System - Powered by INOPS Technology</p>
            </div>
        </footer>
    )
}
export default Footer;