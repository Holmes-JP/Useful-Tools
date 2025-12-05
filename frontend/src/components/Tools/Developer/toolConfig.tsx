import { Fingerprint, Globe2, Hash, KeyRound, Lock, Router, Shield, ShieldCheck, Sparkles, FileSearch, TextSearch, Code, Link as LinkIcon, QrCode, FileText, Search } from "lucide-react";
import GeneratorsPanel from "./Panels/GeneratorsPanel";
import HashAnalyzerPanel from "./Panels/HashAnalyzerPanel";
import JWTAnalyzerPanel from "./Panels/JWTAnalyzerPanel";
import HashIdentifierPanel from "./Panels/HashIdentifierPanel";
import CertificateAnalyzerPanel from "./Panels/CertificateAnalyzerPanel";
import FileTypeAnalyzerPanel from "./Panels/FileTypeAnalyzerPanel";
import MetadataAnalyzerPanel from "./Panels/MetadataAnalyzerPanel";
import RegexTesterPanel from "./Panels/RegexTesterPanel";
import JsonYamlValidatorPanel from "./Panels/JsonYamlValidatorPanel";
import EncodingInspectorPanel from "./Panels/EncodingInspectorPanel";
import NetworkUtilsPanel from "./Panels/NetworkUtilsPanel";
import WebToolsPanel from "./Panels/WebToolsPanel";
import QRPanel from "./Panels/QRPanel";
import Base64EncodePanel from "./Panels/Base64EncodePanel";
import HTTPHeaderViewerPanel from "./Panels/HTTPHeaderViewerPanel";
import RedirectCheckerPanel from "./Panels/RedirectCheckerPanel";
import CORSTesterPanel from "./Panels/CORSTesterPanel";
import CookieAnalyzerPanel from "./Panels/CookieAnalyzerPanel";
import UrlEncoderPanel from "./Panels/UrlEncoderPanel";
import MarkdownHtmlPanel from "./Panels/MarkdownHtmlPanel";
import CidrCalculatorPanel from "./Panels/CidrCalculatorPanel";
import DnsLookupPanel from "./Panels/DnsLookupPanel";
import ReverseDnsPanel from "./Panels/ReverseDnsPanel";
import WhoisLookupPanel from "./Panels/WhoisLookupPanel";
import GeoLookupPanel from "./Panels/GeoLookupPanel";

export type ChildTool = {
    slug: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    element: React.ReactNode;
};

export type ToolCard = {
    slug: string;
    label: string;
    description: string;
    color: string;
    icon: React.ReactNode;
    children: ChildTool[];
};

export const toolCards: Record<string, ToolCard> = {
    generators: {
        slug: "generators",
        label: "Generators",
        description: "UUID, passwords, RSA keys, crypto & QR tools",
        color: "bg-sky-500 text-black hover:bg-sky-400",
        icon: <Sparkles size={18} />,
        children: [
            { slug: "uuid", label: "UUID", description: "Generate multiple UUIDs", icon: <Fingerprint size={16} />, element: <GeneratorsPanel view="uuid" /> },
            { slug: "passwords", label: "Passwords", description: "Strong password generator", icon: <Lock size={16} />, element: <GeneratorsPanel view="password" /> },
            { slug: "hash", label: "Hash", description: "Hash text or files", icon: <Hash size={16} />, element: <GeneratorsPanel view="hash" /> },
            { slug: "base64", label: "Base64 Encode", description: "Text or files to Base64 / data URI", icon: <LinkIcon size={16} />, element: <Base64EncodePanel /> },
            { slug: "qr", label: "QR Codes", description: "Generate and decode QR images", icon: <QrCode size={16} />, element: <QRPanel /> },
            { slug: "crypto", label: "AES / HMAC", description: "Encrypt/decrypt AES, generate & verify HMAC", icon: <ShieldCheck size={16} />, element: <GeneratorsPanel view="crypto" /> },
            { slug: "keys", label: "RSA Keys", description: "Generate RSA key pairs", icon: <KeyRound size={16} />, element: <GeneratorsPanel view="keys" /> },
        ],
    },
    analyzers: {
        slug: "analyzers",
        label: "Analyzers",
        description: "Hash analysis and security helpers",
        color: "bg-rose-400 text-black hover:bg-rose-300",
        icon: <ShieldCheck size={18} />,
        children: [
            { slug: "hashanalyzer", label: "Hash Analyzer", description: "Dictionary attack for hashes", icon: <ShieldCheck size={16} />, element: <HashAnalyzerPanel /> },
            { slug: "jwt", label: "JWT Analyzer", description: "Decode, inspect claims, verify signature", icon: <ShieldCheck size={16} />, element: <JWTAnalyzerPanel /> },
            { slug: "hash-id", label: "Hash Identifier", description: "Guess hash algorithms from format", icon: <Fingerprint size={16} />, element: <HashIdentifierPanel /> },
            { slug: "cert", label: "Certificate Analyzer", description: "Parse PEM/DER, view validity & SAN", icon: <Hash size={16} />, element: <CertificateAnalyzerPanel /> },
            { slug: "filetype", label: "File Type Analyzer", description: "Magic-number based file detection", icon: <Shield size={16} />, element: <FileTypeAnalyzerPanel /> },
            { slug: "metadata", label: "Metadata Analyzer", description: "Analyze EXIF, GPS, privacy risks", icon: <FileSearch size={16} />, element: <MetadataAnalyzerPanel /> },
            { slug: "regex", label: "Regex Tester", description: "Test and debug regular expressions", icon: <TextSearch size={16} />, element: <RegexTesterPanel /> },
            { slug: "json-yaml", label: "JSON/YAML Validator", description: "Validate, pretty-print, convert", icon: <Code size={16} />, element: <JsonYamlValidatorPanel /> },
            { slug: "encoding", label: "Encoding Inspector", description: "Base64 / Hex / URL detection & decode", icon: <LinkIcon size={16} />, element: <EncodingInspectorPanel /> },
        ],
    },
    "web-tools": {
        slug: "web-tools",
        label: "Web Tools",
        description: "Headers, redirects, and HTTP helpers",
        color: "bg-emerald-500 text-black hover:bg-emerald-400",
        icon: <Globe2 size={18} />,
        children: [
            { slug: "webtools", label: "Web Tools", description: "Inspect and debug web endpoints", icon: <Globe2 size={16} />, element: <WebToolsPanel /> },
            { slug: "headers", label: "HTTP Header Viewer", description: "View response headers, security, cookies", icon: <LinkIcon size={16} />, element: <HTTPHeaderViewerPanel /> },
            { slug: "redirects", label: "Redirect Checker", description: "Follow and summarize redirect chains", icon: <ShieldCheck size={16} />, element: <RedirectCheckerPanel /> },
            { slug: "cors", label: "CORS Tester", description: "Simulate preflight & CORS rules", icon: <Shield size={16} />, element: <CORSTesterPanel /> },
            { slug: "cookies", label: "Cookie Analyzer", description: "Evaluate Set-Cookie security flags", icon: <Shield size={16} />, element: <CookieAnalyzerPanel /> },
            { slug: "url-encoder", label: "URL Encoder / Decoder", description: "Encode or decode URL strings quickly", icon: <LinkIcon size={16} />, element: <UrlEncoderPanel /> },
            { slug: "markdown-html", label: "Markdown → HTML", description: "Convert Markdown to HTML with preview", icon: <FileText size={16} />, element: <MarkdownHtmlPanel /> },
        ],
    },
    "network-tools": {
        slug: "network-tools",
        label: "Network Tools",
        description: "CIDR, QR, hashes, quick utilities",
        color: "bg-amber-400 text-black hover:bg-amber-300",
        icon: <Router size={18} />,
        children: [
            { slug: "networkutils", label: "Network Utils", description: "Subnet calculator, QR, hashes", icon: <Router size={16} />, element: <NetworkUtilsPanel /> },
            { slug: "cidr", label: "CIDR Calculator", description: "Network/broadcast, hosts, wildcard", icon: <Router size={16} />, element: <CidrCalculatorPanel /> },
            { slug: "dns", label: "DNS Lookup", description: "Fetch A/AAAA/MX/NS/TXT and more", icon: <Search size={16} />, element: <DnsLookupPanel /> },
            { slug: "reverse-dns", label: "Reverse DNS", description: "PTR lookup and forward confirmation", icon: <Search size={16} />, element: <ReverseDnsPanel /> },
            { slug: "whois", label: "WHOIS Lookup", description: "Registrar, dates, status, nameservers", icon: <Search size={16} />, element: <WhoisLookupPanel /> },
            { slug: "geoip", label: "IP → Geo Lookup", description: "Geo, ISP/ASN, PTR from IP/domain", icon: <Globe2 size={16} />, element: <GeoLookupPanel /> },
        ],
    },
};
