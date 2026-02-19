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

export const WelcomeEmail = ({ name = 'User' }: { name?: string }) => (
    <Html>
        <Preview>Добро пожаловать в lnkmx.my!</Preview>
        <Container style={container}>
            <Section style={box}>
                <Img
                    src="https://lnkmx.my/favicon.png"
                    width="48"
                    height="48"
                    alt="lnkmx.my"
                    style={logo}
                />
                <Text style={heading}>Привет, {name}!</Text>
                <Text style={paragraph}>
                    Спасибо, что присоединились к <strong>lnkmx.my</strong> — лучшему конструктору мультиссылок и мини-сайтов.
                </Text>
                <Text style={paragraph}>
                    Готовы создать свою первую страницу? Это займет всего пару минут.
                </Text>
                <Button pX={20} pY={12} style={button} href="https://lnkmx.my/dashboard">
                    Создать страницу
                </Button>
                <Hr style={hr} />
                <Text style={footer}>
                    Нужна помощь? Прочтите наши <a href="https://lnkmx.my/docs" style={link}>гайды</a> или напишите в поддержку.
                </Text>
                <Text style={footer}>
                    2026 lnkmx.my. Все права защищены.
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
    borderRadius: '12px'
};

const heading = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center' as const,
    marginBottom: '24px'
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a4a4a',
    marginBottom: '24px'
};

const button = {
    backgroundColor: '#7c3aed',
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
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const
};

const link = {
    color: '#7c3aed'
};
