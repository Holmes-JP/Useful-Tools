import { Helmet } from 'react-helmet-async';

type Props = {
    title?: string;
    description?: string;
    path?: string;
};

export default function Head({ title, description, path }: Props) {
    const siteTitle = "Useful Tools";
    const defaultDescription = "Secure & Serverless online tools. Convert video, compress image, and merge PDF locally in your browser.";
    const domain = "https://usefulhub.net";
    
    const pageTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const pageDescription = description || defaultDescription;
    const pageUrl = path ? `${domain}${path}` : domain;

    return (
        <Helmet>
            {/* 基本設定 */}
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <link rel="canonical" href={pageUrl} />

            {/* OGP (SNSシェア用) */}
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={siteTitle} />
            {/* ※将来的にog:imageも設定すると良いです */}
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
        </Helmet>
    );
}