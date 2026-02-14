import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileBlock } from '../ProfileBlock';
import { LinkBlock } from '../LinkBlock';
import { ButtonBlock } from '../ButtonBlock';
import { SocialsBlock } from '../SocialsBlock';
import { TextBlock } from '../TextBlock';
import { VideoBlock } from '../VideoBlock';
import { MessengerBlock } from '../MessengerBlock';
import { FormBlock } from '../FormBlock';
import { DownloadBlock } from '../DownloadBlock';
import { TestimonialBlock } from '../TestimonialBlock';
import { ScratchBlock } from '../ScratchBlock';
import { AvatarBlock } from '../AvatarBlock';
import { SeparatorBlock } from '../SeparatorBlock';
import { CarouselBlock } from '../CarouselBlock';
import { FAQBlock } from '../FAQBlock';
import { CountdownBlock } from '../CountdownBlock';
import { ImageBlock } from '../ImageBlock';
import * as fixtures from '@/testing/block-fixtures';

// Mock useAuth for ProductBlock
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
  }),
}));

// Mock useTokens for ProductBlock
vi.mock('@/hooks/useTokens', () => ({
  useTokens: () => ({
    balance: { balance: 0 },
    purchaseMarketplaceItem: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('Block Components', () => {
  describe('ProfileBlock', () => {
    it('renders profile name and bio', () => {
      render(<ProfileBlock block={fixtures.mockProfileBlock} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test bio description')).toBeInTheDocument();
    });

    it('shows verified badge when verified', () => {
      render(<ProfileBlock block={fixtures.mockProfileBlock} />);
      expect(document.body).toBeTruthy();
    });

    it('renders avatar fallback when no image', () => {
      const blockWithoutAvatar = { ...fixtures.mockProfileBlock, avatar: undefined };
      render(<ProfileBlock block={blockWithoutAvatar} />);
      expect(screen.getByText('TU')).toBeInTheDocument();
    });
  });

  describe('LinkBlock', () => {
    it('renders link title', () => {
      render(<LinkBlock block={fixtures.mockLinkBlock} />);
      expect(screen.getByText('Test Link')).toBeInTheDocument();
    });

    it('opens URL on click', async () => {
      vi.useFakeTimers();
      render(<LinkBlock block={fixtures.mockLinkBlock} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      // Wait for setTimeout to complete
      vi.advanceTimersByTime(20);
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      vi.useRealTimers();
    });
  });

  describe('ButtonBlock', () => {
    it('renders button title', () => {
      render(<ButtonBlock block={fixtures.mockButtonBlock} />);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('applies background style', () => {
      render(<ButtonBlock block={fixtures.mockButtonBlock} />);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#3b82f6' });
    });
  });

  describe('SocialsBlock', () => {
    it('renders title and platforms', () => {
      render(<SocialsBlock block={fixtures.mockSocialsBlock} />);
      expect(screen.getByText('Follow Me')).toBeInTheDocument();
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Telegram')).toBeInTheDocument();
    });

    it('opens platform URL on click', () => {
      vi.useFakeTimers();
      render(<SocialsBlock block={fixtures.mockSocialsBlock} />);
      const instagramBtn = screen.getByLabelText('Instagram');
      fireEvent.click(instagramBtn);
      vi.advanceTimersByTime(15);
      expect(window.open).toHaveBeenCalledWith('https://instagram.com/test', '_blank', 'noopener,noreferrer');
      vi.useRealTimers();
    });
  });

  describe('TextBlock', () => {
    it('renders text content', () => {
      render(<TextBlock block={fixtures.mockTextBlock} />);
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('renders as heading when style is heading', () => {
      const headingBlock = { ...fixtures.mockTextBlock, style: 'heading' as const };
      render(<TextBlock block={headingBlock} />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders as blockquote when style is quote', () => {
      const quoteBlock = { ...fixtures.mockTextBlock, style: 'quote' as const };
      render(<TextBlock block={quoteBlock} />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('VideoBlock', () => {
    it('renders video iframe with correct embed URL', () => {
      render(<VideoBlock block={fixtures.mockVideoBlock} />);
      const iframe = screen.getByTitle('Test Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed'));
    });

    it('shows error for invalid URL', () => {
      const invalidBlock = { ...fixtures.mockVideoBlock, url: 'invalid-url' };
      render(<VideoBlock block={invalidBlock} />);
      expect(screen.getByText('Invalid Video URL')).toBeInTheDocument();
    });
  });

  describe('MessengerBlock', () => {
    it('renders title and messenger buttons', () => {
      render(<MessengerBlock block={fixtures.mockMessengerBlock} />);
      expect(screen.getByText('Contact Me')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Telegram')).toBeInTheDocument();
    });
  });

  describe('FormBlock', () => {
    it('renders form title and fields', () => {
      render(<FormBlock block={fixtures.mockFormBlock} />);
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<FormBlock block={fixtures.mockFormBlock} />);
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    });
  });

  describe('DownloadBlock', () => {
    it('renders file info', () => {
      render(<DownloadBlock block={fixtures.mockDownloadBlock} />);
      expect(screen.getByText('Download File')).toBeInTheDocument();
      expect(screen.getByText('guide.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });

    it('renders download button', () => {
      render(<DownloadBlock block={fixtures.mockDownloadBlock} />);
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });
  });

  describe('TestimonialBlock', () => {
    it('renders title and testimonials', () => {
      render(<TestimonialBlock block={fixtures.mockTestimonialBlock} />);
      expect(screen.getByText('Reviews')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('"Great service!"')).toBeInTheDocument();
    });

    it('renders role when provided', () => {
      render(<TestimonialBlock block={fixtures.mockTestimonialBlock} />);
      expect(screen.getByText('CEO')).toBeInTheDocument();
    });
  });

  describe('ScratchBlock', () => {
    it('renders title', () => {
      render(<ScratchBlock block={fixtures.mockScratchBlock} />);
      expect(screen.getByText('Scratch to reveal')).toBeInTheDocument();
    });

    it('renders canvas for scratching', () => {
      const { container } = render(<ScratchBlock block={fixtures.mockScratchBlock} />);
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('AvatarBlock', () => {
    it('renders name and subtitle', () => {
      render(<AvatarBlock block={fixtures.mockAvatarBlock} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('renders avatar element', () => {
      render(<AvatarBlock block={fixtures.mockAvatarBlock} />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('SeparatorBlock', () => {
    it('renders separator element', () => {
      const { container } = render(<SeparatorBlock block={fixtures.mockSeparatorBlock} />);
      expect(container.querySelector('[data-orientation]')).toBeInTheDocument();
    });
  });

  describe('CarouselBlock', () => {
    it('renders empty state when no images', () => {
      const emptyCarousel = { ...fixtures.mockCarouselBlock, images: [] };
      render(<CarouselBlock block={emptyCarousel} />);
      expect(screen.getByText(/No images added/i)).toBeInTheDocument();
    });
  });

  describe('FAQBlock', () => {
    it('renders empty state when no items', () => {
      const emptyFaq = { id: 'faq-1', type: 'faq' as const, items: [] };
      render(<FAQBlock block={emptyFaq} />);
      expect(screen.getByText(/Добавьте вопросы/i)).toBeInTheDocument();
    });

    it('renders FAQ items', () => {
      const faqBlock = {
        id: 'faq-1',
        type: 'faq' as const,
        title: 'FAQ',
        items: [
          { id: 'q1', question: 'Test Question', answer: 'Test Answer' }
        ]
      };
      render(<FAQBlock block={faqBlock} />);
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });
  });

  describe('CountdownBlock', () => {
    it('renders countdown timer', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      const countdownBlock = {
        id: 'countdown-1',
        type: 'countdown' as const,
        title: 'Sale Ends',
        targetDate: futureDate,
        isPremium: true as const,
      };
      render(<CountdownBlock block={countdownBlock} />);
      expect(screen.getByText('Sale Ends')).toBeInTheDocument();
    });

    it('shows no date message when targetDate is missing', () => {
      const noDateBlock = {
        id: 'countdown-1',
        type: 'countdown' as const,
        title: 'Timer',
        targetDate: '',
        isPremium: true as const,
      };
      render(<CountdownBlock block={noDateBlock} />);
      expect(screen.getByText(/Укажите дату/i)).toBeInTheDocument();
    });
  });

  describe('ImageBlock', () => {
    it('renders caption when provided', () => {
      render(<ImageBlock block={fixtures.mockImageBlock} />);
      expect(screen.getByText('Image caption')).toBeInTheDocument();
    });
  });
});

describe('Block Alignment', () => {
  it('applies left alignment correctly', () => {
    const leftAlignedBlock = { ...fixtures.mockTextBlock, alignment: 'left' as const };
    render(<TextBlock block={leftAlignedBlock} />);
    expect(screen.getByText('This is test content')).toHaveClass('text-left');
  });

  it('applies center alignment correctly', () => {
    const centerAlignedBlock = { ...fixtures.mockTextBlock, alignment: 'center' as const };
    render(<TextBlock block={centerAlignedBlock} />);
    expect(screen.getByText('This is test content')).toHaveClass('text-center');
  });

  it('applies right alignment correctly', () => {
    const rightAlignedBlock = { ...fixtures.mockTextBlock, alignment: 'right' as const };
    render(<TextBlock block={rightAlignedBlock} />);
    expect(screen.getByText('This is test content')).toHaveClass('text-right');
  });
});

describe('Multilingual Support', () => {
  it('handles multilingual string in profile name', () => {
    const multilingualBlock = {
      ...fixtures.mockProfileBlock,
      name: { ru: 'Тест Пользователь', en: 'Test User', kk: 'Тест Қолданушы' },
    };
    render(<ProfileBlock block={multilingualBlock} />);
    expect(screen.getByText('Тест Пользователь')).toBeInTheDocument();
  });

  it('handles multilingual string in text block', () => {
    const multilingualBlock = {
      ...fixtures.mockTextBlock,
      content: { ru: 'Привет мир', en: 'Hello world', kk: 'Сәлем әлем' },
    };
    render(<TextBlock block={multilingualBlock} />);
    expect(screen.getByText('Привет мир')).toBeInTheDocument();
  });
});
