/**
 * Input Sanitization Utilities
 * 
 * Provides sanitization functions to prevent XSS and other injection attacks.
 * Used throughout the application to clean user-generated content before
 * rendering or processing.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param dirty - Potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(
    dirty: string,
    options?: {
        allowedTags?: string[];
        allowedAttributes?: Record<string, string[]>;
    }
): string {
    const config: any = {
        ALLOWED_TAGS: options?.allowedTags || [
            'p', 'br', 'strong', 'em', 'u', 's', 'strike',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre', 'a', 'span', 'div'
        ],
        ALLOWED_ATTR: options?.allowedAttributes || {
            'a': ['href', 'title', 'target'],
            'span': ['class'],
            'div': ['class'],
            'code': ['class']
        },
        // Remove all scripts and event handlers
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
        // Keep relative URLs
        ALLOW_DATA_ATTR: false,
        // Return sanitized string only
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
    };

    return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize markdown content before rendering
 * More permissive than HTML sanitization but still safe
 * 
 * @param markdown - Markdown content (potentially containing HTML)
 * @returns Sanitized markdown
 */
export function sanitizeMarkdown(markdown: string): string {
    // Allow common markdown-generated HTML elements
    return sanitizeHtml(markdown, {
        allowedTags: [
            'p', 'br', 'strong', 'em', 'u', 's', 'strike',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
            'tbody', 'tr', 'th', 'td', 'hr', 'del', 'ins'
        ],
        allowedAttributes: {
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title'],
            'code': ['class'], // For syntax highlighting
            'th': ['align'],
            'td': ['align'],
        }
    });
}

/**
 * Sanitize text content (strip all HTML)
 * Use for plain text fields like titles, names, etc.
 * 
 * @param text - Text content
 * @returns Plain text without any HTML tags
 */
export function sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 * 
 * @param url - URL string
 * @returns Safe URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    if (
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('file:')
    ) {
        console.warn('Blocked dangerous URL:', url);
        return '';
    }

    // Allow http(s), mailto, tel
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('/') || // Relative URLs
        trimmed.startsWith('#') // Hash links
    ) {
        return url;
    }

    // Default to empty for anything else
    console.warn('Unknown URL protocol:', url);
    return '';
}

/**
 * Sanitize JSON input to prevent injection
 * Validates JSON structure and removes dangerous content
 * 
 * @param jsonString - JSON string
 * @returns Parsed and sanitized object or null if invalid
 */
export function sanitizeJson<T = any>(jsonString: string): T | null {
    try {
        const parsed = JSON.parse(jsonString);

        // Recursively sanitize string values
        const sanitizeObject = (obj: any): any => {
            if (typeof obj === 'string') {
                return sanitizeText(obj);
            } else if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            } else if (obj !== null && typeof obj === 'object') {
                const sanitized: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[sanitizeText(key)] = sanitizeObject(value);
                }
                return sanitized;
            }
            return obj;
        };

        return sanitizeObject(parsed) as T;
    } catch (error) {
        console.error('Invalid JSON input:', error);
        return null;
    }
}

/**
 * Sanitize filename to prevent directory traversal
 * 
 * @param filename - Filename from user input
 * @returns Safe filename or default
 */
export function sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let safe = filename.replace(/\.\./g, '');
    safe = safe.replace(/[\/\\]/g, '');

    // Remove non-alphanumeric except dots, dashes, underscores
    safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Limit length
    safe = safe.substring(0, 255);

    // Ensure it has a name (not just extension)
    if (!safe || safe.startsWith('.')) {
        safe = 'file_' + Date.now() + safe;
    }

    return safe;
}

/**
 * Test vector for XSS attacks
 * Used in unit tests to verify sanitization works
 */
export const XSS_TEST_VECTORS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
    '<textarea onfocus=alert("XSS") autofocus>',
    '<marquee onstart=alert("XSS")>',
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
    '<IMG SRC="javascript:alert(\'XSS\');">',
];
