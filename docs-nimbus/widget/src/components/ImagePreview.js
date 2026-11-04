
import { Component } from './Component.js';

export class ImagePreview extends Component {
  constructor(container) {
    super(container);
    this.visible = false;
    this.imageUrl = '';
  }

  render() {
    if (!this.visible) {
      if (this.elements.root) {
        this.elements.root.remove();
        this.elements.root = null;
      }
      return;
    }

    const root = this.createElement('div', {
      className: 'cwd-image-preview-overlay',
      attributes: {
        role: 'dialog',
        'aria-modal': 'true',
        onClick: (e) => this.handleOverlayClick(e)
      },
      children: [
        this.createElement('div', {
          className: 'cwd-image-preview-content',
          children: [
            this.createElement('img', {
              className: 'cwd-image-preview-img',
              attributes: {
                src: this.imageUrl,
                alt: 'Preview'
              }
            }),
            this.createElement('button', {
              className: 'cwd-image-preview-close',
              attributes: {
                type: 'button',
                'aria-label': 'Close preview',
                onClick: () => this.close()
              },
              html: '&times;'
            })
          ]
        })
      ]
    });

    this.elements.root = root;
    this.container.appendChild(root);
  }

  open(url) {
    this.imageUrl = url;
    this.visible = true;
    this.render();
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  close() {
    this.visible = false;
    this.imageUrl = '';
    this.render();
    document.body.style.overflow = ''; // Restore scrolling
  }

  handleOverlayClick(e) {
    if (e.target.classList.contains('cwd-image-preview-overlay') || 
        e.target.classList.contains('cwd-image-preview-content')) {
      this.close();
    }
  }
}
