class Whiteboard {
            constructor() {
                this.canvas = document.getElementById('whiteboard');
                this.ctx = this.canvas.getContext('2d');
                this.isDrawing = false;
                this.currentTool = 'pen';
                this.currentColor = '#000000';
                this.currentSize = 3;
                this.startX = 0;
                this.startY = 0;
                this.savedImageData = null;
                
                // Image handling
                this.isDraggingImage = false;
                this.selectedImage = null;
                this.imageStartX = 0;
                this.imageStartY = 0;
                
                // Dark mode
                this.isDarkMode = false;
                
                // Slide management
                this.slides = [];
                this.currentSlideIndex = 0;
                this.slideIdCounter = 1;
                
                this.setupCanvas();
                this.setupEventListeners();
                this.setupToolbar();
                this.initializeSlides();
            }

            setupCanvas() {
                const container = this.canvas.parentElement;
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
                
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.clearCanvas();
            }

            initializeSlides() {
                // Create first slide
                this.addSlide();
            }

            addSlide() {
                const slideData = {
                    id: this.slideIdCounter++,
                    imageData: null,
                    thumbnail: null
                };
                
                this.slides.push(slideData);
                this.createSlideThumbnail(slideData, this.slides.length - 1);
                this.switchToSlide(this.slides.length - 1);
                this.updateSlideIndicator();
            }

            createSlideThumbnail(slideData, index) {
                const slidesContainer = document.getElementById('slidesContainer');
                
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'slide-thumbnail';
                thumbnailDiv.dataset.slideIndex = index;
                
                const slideNumber = document.createElement('div');
                slideNumber.className = 'slide-number';
                slideNumber.textContent = `${index + 1}`;
                
                const slideActions = document.createElement('div');
                slideActions.className = 'slide-actions';
                
                const duplicateBtn = document.createElement('button');
                duplicateBtn.className = 'slide-action-btn';
                duplicateBtn.innerHTML = '📋';
                duplicateBtn.title = 'Duplicate';
                duplicateBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.duplicateSlide(index);
                };
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'slide-action-btn delete-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteSlide(index);
                };
                
                slideActions.appendChild(duplicateBtn);
                if (this.slides.length > 1) {
                    slideActions.appendChild(deleteBtn);
                }
                
                const thumbnailCanvas = document.createElement('canvas');
                thumbnailCanvas.width = 230;
                thumbnailCanvas.height = 100;
                
                const thumbnailCtx = thumbnailCanvas.getContext('2d');
                thumbnailCtx.fillStyle = '#ffffff';
                thumbnailCtx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
                
                thumbnailDiv.appendChild(slideNumber);
                thumbnailDiv.appendChild(slideActions);
                thumbnailDiv.appendChild(thumbnailCanvas);
                
                thumbnailDiv.onclick = () => this.switchToSlide(index);
                
                slidesContainer.appendChild(thumbnailDiv);
                slideData.thumbnail = thumbnailCanvas;
            }

            switchToSlide(index) {
                if (index < 0 || index >= this.slides.length) return;
                
                // Save current slide data
                if (this.slides[this.currentSlideIndex]) {
                    this.slides[this.currentSlideIndex].imageData = 
                        this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    this.updateThumbnail(this.currentSlideIndex);
                }
                
                // Switch to new slide
                this.currentSlideIndex = index;
                
                // Load slide data
                if (this.slides[index].imageData) {
                    this.ctx.putImageData(this.slides[index].imageData, 0, 0);
                } else {
                    this.clearCanvas();
                }
                
                // Update UI
                this.updateSlideSelection();
                this.updateSlideIndicator();
            }

            updateThumbnail(slideIndex) {
                const slide = this.slides[slideIndex];
                if (!slide || !slide.thumbnail) return;
                
                const thumbnailCtx = slide.thumbnail.getContext('2d');
                const scaleX = slide.thumbnail.width / this.canvas.width;
                const scaleY = slide.thumbnail.height / this.canvas.height;
                
                thumbnailCtx.clearRect(0, 0, slide.thumbnail.width, slide.thumbnail.height);
                if (this.isDarkMode) {
                    thumbnailCtx.fillStyle = '#1a1a1a';
                } else {
                    thumbnailCtx.fillStyle = '#ffffff';
                }
                thumbnailCtx.fillRect(0, 0, slide.thumbnail.width, slide.thumbnail.height);
                
                if (slide.imageData) {
                    // Create temporary canvas to draw the slide data
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.canvas.width;
                    tempCanvas.height = this.canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.putImageData(slide.imageData, 0, 0);
                    
                    thumbnailCtx.drawImage(tempCanvas, 0, 0, slide.thumbnail.width, slide.thumbnail.height);
                }
            }

            updateSlideSelection() {
                document.querySelectorAll('.slide-thumbnail').forEach((thumb, index) => {
                    thumb.classList.toggle('active', index === this.currentSlideIndex);
                });
            }

            updateSlideIndicator() {
                const indicator = document.getElementById('slideIndicator');
                indicator.textContent = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;
            }

            duplicateSlide(index) {
                const originalSlide = this.slides[index];
                const newSlide = {
                    id: this.slideIdCounter++,
                    imageData: originalSlide.imageData ? 
                        new ImageData(
                            new Uint8ClampedArray(originalSlide.imageData.data),
                            originalSlide.imageData.width,
                            originalSlide.imageData.height
                        ) : null,
                    thumbnail: null
                };
                
                this.slides.splice(index + 1, 0, newSlide);
                this.refreshSlideThumbnails();
                this.switchToSlide(index + 1);
            }

            deleteSlide(index) {
                if (this.slides.length <= 1) return;
                
                if (confirm('Are you sure you want to delete this slide?')) {
                    this.slides.splice(index, 1);
                    
                    if (this.currentSlideIndex >= index && this.currentSlideIndex > 0) {
                        this.currentSlideIndex--;
                    }
                    
                    this.refreshSlideThumbnails();
                    this.switchToSlide(this.currentSlideIndex);
                }
            }

            refreshSlideThumbnails() {
                const slidesContainer = document.getElementById('slidesContainer');
                slidesContainer.innerHTML = '';
                
                this.slides.forEach((slide, index) => {
                    this.createSlideThumbnail(slide, index);
                    this.updateThumbnail(index);
                });
                
                this.updateSlideSelection();
                this.updateSlideIndicator();
            }

            setupEventListeners() {
                // Mouse events
                this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
                this.canvas.addEventListener('mousemove', (e) => this.draw(e));
                this.canvas.addEventListener('mouseup', () => this.stopDrawing());
                this.canvas.addEventListener('mouseout', () => this.stopDrawing());

                // Touch events for mobile
                this.canvas.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const mouseEvent = new MouseEvent('mousedown', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    this.canvas.dispatchEvent(mouseEvent);
                });

                this.canvas.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const mouseEvent = new MouseEvent('mousemove', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    this.canvas.dispatchEvent(mouseEvent);
                });

                this.canvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    const mouseEvent = new MouseEvent('mouseup', {});
                    this.canvas.dispatchEvent(mouseEvent);
                });

                // Window resize
                window.addEventListener('resize', () => this.setupCanvas());
            }

            setupToolbar() {
                // Tool buttons
                document.querySelectorAll('[data-tool]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.currentTool = btn.dataset.tool;
                        this.updateCursor();
                    });
                });

                // Color picker
                document.getElementById('colorPicker').addEventListener('change', (e) => {
                    this.currentColor = e.target.value;
                    this.updateColorSelection(e.target.value);
                });

                // Color palette buttons
                document.querySelectorAll('.color-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const color = btn.dataset.color;
                        this.currentColor = color;
                        document.getElementById('colorPicker').value = color;
                        this.updateColorSelection(color);
                    });
                });

                // Brush size
                const sizeSlider = document.getElementById('brushSize');
                const sizeDisplay = document.getElementById('sizeDisplay');
                
                sizeSlider.addEventListener('input', (e) => {
                    this.currentSize = parseInt(e.target.value);
                    sizeDisplay.textContent = this.currentSize + 'px';
                });

                // Add slide button
                document.getElementById('addSlideBtn').addEventListener('click', () => {
                    this.addSlide();
                });

                // Clear button
                document.getElementById('clearBtn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear this slide?')) {
                        this.clearCanvas();
                        this.slides[this.currentSlideIndex].imageData = null;
                        this.updateThumbnail(this.currentSlideIndex);
                    }
                });

                // Export button
                document.getElementById('exportBtn').addEventListener('click', () => {
                    this.exportToPDF();
                });

                // Image upload
                document.getElementById('imageBtn').addEventListener('click', () => {
                    document.getElementById('imageUpload').click();
                });

                document.getElementById('imageUpload').addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        this.insertImage(file);
                    }
                    e.target.value = ''; // Reset file input
                });

                // Dark mode toggle
                document.getElementById('modeToggle').addEventListener('click', () => {
                    this.toggleDarkMode();
                });
            }

            updateColorSelection(selectedColor) {
                document.querySelectorAll('.color-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.color === selectedColor);
                });
            }

            updateCursor() {
                const cursors = {
                    pen: 'crosshair',
                    eraser: 'grab',
                    line: 'crosshair',
                    rectangle: 'crosshair',
                    circle: 'crosshair'
                };
                this.canvas.style.cursor = cursors[this.currentTool] || 'crosshair';
            }

            getMousePos(e) {
                const rect = this.canvas.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }

            startDrawing(e) {
                this.isDrawing = true;
                const pos = this.getMousePos(e);
                this.startX = pos.x;
                this.startY = pos.y;

                if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
                    this.ctx.beginPath();
                    this.ctx.moveTo(pos.x, pos.y);
                } else {
                    this.savedImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                }
            }

            draw(e) {
                if (!this.isDrawing) return;

                const pos = this.getMousePos(e);
                this.ctx.lineWidth = this.currentSize;
                this.ctx.strokeStyle = this.currentColor;

                switch (this.currentTool) {
                    case 'pen':
                        this.ctx.globalCompositeOperation = 'source-over';
                        this.ctx.lineTo(pos.x, pos.y);
                        this.ctx.stroke();
                        break;

                    case 'eraser':
                        this.ctx.globalCompositeOperation = 'destination-out';
                        this.ctx.lineTo(pos.x, pos.y);
                        this.ctx.stroke();
                        break;

                    case 'line':
                        this.ctx.putImageData(this.savedImageData, 0, 0);
                        this.ctx.globalCompositeOperation = 'source-over';
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.startX, this.startY);
                        this.ctx.lineTo(pos.x, pos.y);
                        this.ctx.stroke();
                        break;

                    case 'rectangle':
                        this.ctx.putImageData(this.savedImageData, 0, 0);
                        this.ctx.globalCompositeOperation = 'source-over';
                        this.ctx.beginPath();
                        this.ctx.rect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
                        this.ctx.stroke();
                        break;

                    case 'circle':
                        this.ctx.putImageData(this.savedImageData, 0, 0);
                        this.ctx.globalCompositeOperation = 'source-over';
                        const radius = Math.sqrt(Math.pow(pos.x - this.startX, 2) + Math.pow(pos.y - this.startY, 2));
                        this.ctx.beginPath();
                        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                        this.ctx.stroke();
                        break;
                }
            }

            stopDrawing() {
                if (this.isDrawing) {
                    this.isDrawing = false;
                    this.ctx.beginPath();
                    
                    // Update thumbnail after drawing
                    setTimeout(() => {
                        this.slides[this.currentSlideIndex].imageData = 
                            this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                        this.updateThumbnail(this.currentSlideIndex);
                    }, 50);
                }
            }

            clearCanvas() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                if (this.isDarkMode) {
                    this.ctx.fillStyle = '#1a1a1a';
                } else {
                    this.ctx.fillStyle = '#ffffff';
                }
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            toggleDarkMode() {
                this.isDarkMode = !this.isDarkMode;
                const body = document.body;
                const modeToggle = document.getElementById('modeToggle');
                
                if (this.isDarkMode) {
                    body.classList.add('dark-mode');
                    modeToggle.innerHTML = '☀️ Light';
                    modeToggle.title = 'Switch to Light Mode';
                    
                    // Update default color to white for dark mode
                    if (this.currentColor === '#000000') {
                        this.currentColor = '#FFFFFF';
                        document.getElementById('colorPicker').value = '#FFFFFF';
                        this.updateColorSelection('#FFFFFF');
                    }
                } else {
                    body.classList.remove('dark-mode');
                    modeToggle.innerHTML = '🌙 Dark';
                    modeToggle.title = 'Switch to Dark Mode';
                    
                    // Update default color to black for light mode
                    if (this.currentColor === '#FFFFFF') {
                        this.currentColor = '#000000';
                        document.getElementById('colorPicker').value = '#000000';
                        this.updateColorSelection('#000000');
                    }
                }
                
                // Redraw current slide with new background
                const currentSlide = this.slides[this.currentSlideIndex];
                if (currentSlide && currentSlide.imageData) {
                    const tempImageData = new ImageData(
                        new Uint8ClampedArray(currentSlide.imageData.data),
                        currentSlide.imageData.width,
                        currentSlide.imageData.height
                    );
                    this.clearCanvas();
                    this.ctx.putImageData(tempImageData, 0, 0);
                } else {
                    this.clearCanvas();
                }
                
                // Update all slide thumbnails
                this.slides.forEach((slide, index) => {
                    this.updateThumbnail(index);
                });
            }

            insertImage(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Calculate dimensions to fit image on canvas while maintaining aspect ratio
                        const maxWidth = this.canvas.width * 0.3; // Max 30% of canvas width
                        const maxHeight = this.canvas.height * 0.3; // Max 30% of canvas height
                        
                        let width = img.width;
                        let height = img.height;
                        
                        // Scale down if too large
                        if (width > maxWidth || height > maxHeight) {
                            const scaleX = maxWidth / width;
                            const scaleY = maxHeight / height;
                            const scale = Math.min(scaleX, scaleY);
                            width *= scale;
                            height *= scale;
                        }
                        
                        // Position image in center of canvas
                        const x = (this.canvas.width - width) / 2;
                        const y = (this.canvas.height - height) / 2;
                        
                        this.ctx.drawImage(img, x, y, width, height);
                        
                        // Save the updated canvas state
                        this.slides[this.currentSlideIndex].imageData = 
                            this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                        this.updateThumbnail(this.currentSlideIndex);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }

            exportToPDF() {
                try {
                    // Save current slide before export
                    this.slides[this.currentSlideIndex].imageData = 
                        this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'px',
                        format: [this.canvas.width, this.canvas.height]
                    });

                    // Create temporary canvas for each slide
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.canvas.width;
                    tempCanvas.height = this.canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');

                    this.slides.forEach((slide, index) => {
                        if (index > 0) {
                            pdf.addPage();
                        }

                        // Clear temp canvas and fill with appropriate background
                        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                        if (this.isDarkMode) {
                            tempCtx.fillStyle = '#1a1a1a';
                        } else {
                            tempCtx.fillStyle = '#ffffff';
                        }
                        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                        // Draw slide content if it exists
                        if (slide.imageData) {
                            tempCtx.putImageData(slide.imageData, 0, 0);
                        }

                        // Convert to image and add to PDF
                        const imgData = tempCanvas.toDataURL('image/png');
                        pdf.addImage(imgData, 'PNG', 0, 0, this.canvas.width, this.canvas.height);
                    });
                    
                    // Generate filename with timestamp
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    const filename = `whiteboard-${this.slides.length}-slides-${timestamp}.pdf`;
                    
                    pdf.save(filename);
                } catch (error) {
                    alert('Error exporting PDF. Please try again.');
                    console.error('PDF export error:', error);
                }
            }
}

// Initialize the whiteboard when the page loads
window.addEventListener('load', () => {
    new Whiteboard();
});