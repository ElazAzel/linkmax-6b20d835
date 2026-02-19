// @ts-nocheck
import React from 'https://esm.sh/react@18.2.0?target=deno';
import { Html } from 'https://esm.sh/@react-email/html@0.0.7?target=deno';
import { Button } from 'https://esm.sh/@react-email/button@0.0.14?target=deno';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7?target=deno';
import { Hr } from 'https://esm.sh/@react-email/hr@0.0.7?target=deno';
import { Container } from 'https://esm.sh/@react-email/container@0.0.10?target=deno';
import { Preview } from 'https://esm.sh/@react-email/preview@0.0.7?target=deno';
import { Section } from 'https://esm.sh/@react-email/section@0.0.11?target=deno';
import { Img } from 'https://esm.sh/@react-email/img@0.0.7?target=deno';

export const LeadNotification = ({
    pageName = 'My Page',
    leadName = 'John Doe',
    leadPhone = '+7 700 000 0000',
    leadMessage = ''
}: {
    pageName?: string;
    leadName?: string;
    leadPhone?: string;
    leadMessage?: string;
}) => (
    <Html>
        <Preview>Новая заявка на вашей странице {pageName}!</Preview>
        <Container style={container}>
            <Section style={box}>
                <Img
                    src="https://lnkmx.my/favicon.png"
                    width="40"
                    height="40"
                    alt="lnkmx.my"
                    style={logo}
                />
                <Text style={heading}> У вас новая заявка!</Text>
                <Text style={paragraph}>
                    Поздравляем! Кто-то оставил заявку на вашей странице <strong>{pageName}</strong>.
                </Text>

                <Section style={dataBox}>
                    <Text style={label}>Имя:</Text>
                    <Text style={value}>{leadName}</Text>

                    <Text style={label}>Телефон:</Text>
                    <Text style={value}>
                        <a href={`tel:${leadPhone}`} style={link}>{leadPhone}</a>
                    </Text>

                    {leadMessage && (
                        <>
                            <Text style={label}>Сообщение:</Text>
                            <Text style={value}>{leadMessage}</Text>
                        </>
                    )}
                </Section>

                <Button pX={20} pY={12} style={button} href="https://lnkmx.my/dashboard/leads">
                    Открыть в CRM
                </Button>
                <Hr style={hr} />
                <Text style={footer}>
                    Не хотите получать эти письма? Измените настройки уведомлений в <a href="https://lnkmx.my/dashboard/settings" style={linkBottom}>дашборде</a>.
                </Text>
            </Section>
        </Container>
    </Html>
);

const container = {
    backgroundColor: '#f6f9fc',
    margin: '0 auto',
    padding: '20px 0 48px',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const box = {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
    maxWidth: '600px',
    margin: '0 auto'
};

const logo = {
    margin: '0 auto 24px',
    borderRadius: '8px'
};

const heading = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center' as const,
    marginBottom: '24px'
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a4a4a',
    marginBottom: '24px',
    textAlign: 'center' as const
};

const dataBox = {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px'
};

const label = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    marginBottom: '4px'
};

const value = {
    fontSize: '16px',
    color: '#111827',
    marginBottom: '16px',
    fontWeight: '500'
};

const button = {
    backgroundColor: '#059669', // Green for success/money
    color: '#fff',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '16px',
    textDecoration: 'none',
    padding: '12px 24px',
    display: 'block',
    textAlign: 'center' as const,
    margin: '0 auto'
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0'
};

const footer = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const
};

const link = {
    color: '#059669',
    textDecoration: 'none'
};

const linkBottom = {
    color: '#6b7280',
    textDecoration: 'underline'
};
