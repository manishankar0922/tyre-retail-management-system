import "./globals.css";
import AuthListener from "@/components/layout/AuthListener";

export const metadata = {
    title: "TyreRetail Pro ERP",
    description: "Tyre Shop Management System",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark bg-zinc-950">
            <body>
                <AuthListener />
                {children}
            </body>
        </html>
    );
}