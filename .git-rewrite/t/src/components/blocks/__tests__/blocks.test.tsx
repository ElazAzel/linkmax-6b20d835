import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileBlock } from '../ProfileBlock';
import { LinkBlock } from '../LinkBlock';
import { ButtonBlock } from '../ButtonBlock';
import { SocialsBlock } from '../SocialsBlock';
import { TextBlock } from '../TextBlock';
import { ImageBlock } from '../ImageBlock';
import { ProductBlock } from '../ProductBlock';
import { VideoBlock } from '../VideoBlock';
import { CarouselBlock } from '../CarouselBlock';
import { SearchBlock } from '../SearchBlock';
import { CustomCodeBlock } from '../CustomCodeBlock';
import { MessengerBlock } from '../MessengerBlock';
import { FormBlock } from '../FormBlock';
import { DownloadBlock } from '../DownloadBlock';
import { NewsletterBlock } from '../NewsletterBlock';
import { TestimonialBlock } from '../TestimonialBlock';
import { ScratchBlock } from '../ScratchBlock';
import { MapBlock } from '../MapBlock';
import { AvatarBlock } from '../AvatarBlock';
import { SeparatorBlock } from '../SeparatorBlock';
import * as fixtures from '@/test/block-fixtures';

describe('Block Components', () => {
  describe('ProfileBlock', () => {
    it('renders profile name and bio', () => {
      render(<ProfileBlock block={fixtures.mockProfileBlock} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test bio description')).toBeInTheDocument();
    });

    it('shows verified badge when verified', () => {
      render(<ProfileBlock block={fixtures.mockProfileBlock} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders avatar fallback when no image', () => {
      const blockWithoutAvatar = { ...fixtures.mockProfileBlock, avatar: undefined };
      render(<ProfileBlock block={blockWithoutAvatar} />);
      expect(screen.getByText('TU')).toBeInTheDocument(); // Initials
    });
  });

  describe('LinkBlock', () => {
    it('renders link title', () => {
      render(<LinkBlock block={fixtures.mockLinkBlock} />);
      expect(screen.getByText('Test Link')).toBeInTheDocument();
    });

    it('opens URL on click', () => {
      render(<LinkBlock block={fixtures.mockLinkBlock} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
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
      render(<SocialsBlock block={fixtures.mockSocialsBlock} />);
      const instagramBtn = screen.getByLabelText('Instagram');
      fireEvent.click(instagramBtn);
      expect(window.open).toHaveBeenCalledWith('https://instagram.com/test', '_blank', 'noopener,noreferrer');
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
      expect(screen.getByRole('blockquote')).toBeInTheDocument();
    });
  });

  describe('ImageBlock', () => {
    it('renders image with alt text', () => {
      render(<ImageBlock block={fixtures.mockImageBlock} />);
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders caption when provided', () => {
      render(<ImageBlock block={fixtures.mockImageBlock} />);
      expect(screen.getByText('Image caption')).toBeInTheDocument();
    });
  });

  describe('ProductBlock', () => {
    it('renders product name and price', () => {
      render(<ProductBlock block={fixtures.mockProductBlock} />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText(/₸1,000/)).toBeInTheDocument();
    });

    it('renders buy button', () => {
      render(<ProductBlock block={fixtures.mockProductBlock} />);
      expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
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

  describe('CarouselBlock', () => {
    it('renders carousel title', () => {
      render(<CarouselBlock block={fixtures.mockCarouselBlock} />);
      expect(screen.getByText('Image Carousel')).toBeInTheDocument();
    });

    it('renders all images', () => {
      render(<CarouselBlock block={fixtures.mockCarouselBlock} />);
      expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    });

    it('shows message when no images', () => {
      const emptyBlock = { ...fixtures.mockCarouselBlock, images: [] };
      render(<CarouselBlock block={emptyBlock} />);
      expect(screen.getByText('No images added to carousel')).toBeInTheDocument();
    });
  });

  describe('SearchBlock', () => {
    it('renders search input and button', () => {
      render(<SearchBlock block={fixtures.mockSearchBlock} />);
      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<SearchBlock block={fixtures.mockSearchBlock} />);
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  describe('CustomCodeBlock', () => {
    it('renders title with premium badge', () => {
      render(<CustomCodeBlock block={fixtures.mockCustomCodeBlock} />);
      expect(screen.getByText('Custom Widget')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders sanitized HTML content', () => {
      render(<CustomCodeBlock block={fixtures.mockCustomCodeBlock} />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
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

  describe('NewsletterBlock', () => {
    it('renders title and email input', () => {
      render(<NewsletterBlock block={fixtures.mockNewsletterBlock} />);
      expect(screen.getByText('Subscribe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    it('renders subscribe button', () => {
      render(<NewsletterBlock block={fixtures.mockNewsletterBlock} />);
      expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument();
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
    it('renders title and instructions', () => {
      render(<ScratchBlock block={fixtures.mockScratchBlock} />);
      expect(screen.getByText('Scratch to reveal')).toBeInTheDocument();
      expect(screen.getByText(/Потрите слой/)).toBeInTheDocument();
    });

    it('renders canvas for scratching', () => {
      const { container } = render(<ScratchBlock block={fixtures.mockScratchBlock} />);
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('MapBlock', () => {
    it('renders title and address', () => {
      render(<MapBlock block={fixtures.mockMapBlock} />);
      expect(screen.getByText('Our Location')).toBeInTheDocument();
      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    });

    it('renders map iframe', () => {
      render(<MapBlock block={fixtures.mockMapBlock} />);
      const iframe = screen.getByTitle('Our Location');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('AvatarBlock', () => {
    it('renders name and subtitle', () => {
      render(<AvatarBlock block={fixtures.mockAvatarBlock} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('renders avatar image', () => {
      render(<AvatarBlock block={fixtures.mockAvatarBlock} />);
      expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    });
  });

  describe('SeparatorBlock', () => {
    it('renders separator element', () => {
      const { container } = render(<SeparatorBlock block={fixtures.mockSeparatorBlock} />);
      expect(container.querySelector('[data-orientation]')).toBeInTheDocument();
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
    // Should render Russian version based on mock i18n.language = 'ru'
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
