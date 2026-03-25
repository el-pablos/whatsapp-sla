export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 mt-auto border-t border-gray-200 bg-white">
      <div className="px-4 mx-auto max-w-screen-2xl lg:px-6">
        <p className="text-sm text-center text-gray-500">
          &copy; {currentYear} WhatsApp SLA Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
