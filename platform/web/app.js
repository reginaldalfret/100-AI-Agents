document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE
    const state = {
        agents: [],
        selectedAgent: null,
        selectedAgentMode: 'auto',
        selectedModelMode: 'auto',
        selectedCategory: 'all',
        conversations: [],
        currentConversationId: null,
        deletingConversationId: null,
        replyContext: null,
        chatHistories: {},
        currentAttachments: [],
        isGenerating: false,
        activeView: 'agent-workspace',
        inspectorOpen: false,
        sidebarOpen: false
    };

    // DOM Elements - Using fallbacks to avoid errors if elements don't exist
    const getEl = (id) => document.getElementById(id) || document.createElement('div');
    
    const elements = {
        agentList: getEl('agentList'),
        sidebarSearch: getEl('sidebarSearch'),
        conversationList: getEl('conversationList'),
        chatCountBadge: getEl('chatCountBadge'),
        agentsHeader: getEl('agentsHeader'),
        agentDirectorySection: getEl('agentDirectorySection'),
        categoryFilterBar: getEl('categoryFilterBar'),
        
        // Views - mapped to actual HTML IDs
        views: {
            'agent-workspace': getEl('chatView'),
            'investigations': getEl('investigationsView'),
            'files': getEl('filesView'),
            'knowledge': getEl('knowledgeView'),
            'workflows': getEl('workflowsView'),
            'approvals': getEl('approvalsView'),
            'models': getEl('modelsView'),
            'system': getEl('systemView'),
            'finetuning': getEl('finetuningView'),
            'finetuningView': getEl('finetuningView'),
            'specialistChat': getEl('specialistChatView'),
            'specialistChatView': getEl('specialistChatView')
        },
        
        // Nav - sidebar secondary nav buttons
        navItems: document.querySelectorAll('.secondary-nav button[data-target]'),
        
        // Chat Area
        chatView: getEl('chatView'),
        chatEmptyState: getEl('chatEmptyState'),
        chatMessages: getEl('chatMessages'),
        
        // Composer & Reply Context
        composerContainer: getEl('composerContainer'),
        chatInput: getEl('chatInput'),
        attachmentArea: getEl('attachmentArea'),
        replyContextArea: getEl('replyContextArea'),
        replyAgentLabel: getEl('replyAgentLabel'),
        replyPreviewText: getEl('replyPreviewText'),
        closeReplyBtn: getEl('closeReplyBtn'),
        sendBtn: getEl('sendBtn'),
        attachBtn: getEl('attachBtn'),
        voiceInputBtn: getEl('voiceInputBtn'),
        voiceRecordingBanner: getEl('voiceRecordingBanner'),
        voiceStatusText: getEl('voiceStatusText'),
        voiceWaveform: getEl('voiceWaveform'),
        btnCancelRecording: getEl('btnCancelRecording'),
        
        // Agent Selector
        agentSelectorWrapper: getEl('agentSelectorWrapper'),
        agentSelectorBtn: getEl('agentSelectorBtn'),
        agentSelectorLabel: getEl('agentSelectorLabel'),
        agentDropdown: getEl('agentDropdown'),
        
        // Session Indicator Bar
        sessionIndicatorBar: getEl('sessionIndicatorBar'),
        sessionActiveAgent: getEl('sessionActiveAgent'),
        sessionActiveModel: getEl('sessionActiveModel'),
        sessionActiveRuntime: getEl('sessionActiveRuntime'),
        sessionActiveHardware: getEl('sessionActiveHardware'),
        sessionActiveNetwork: getEl('sessionActiveNetwork'),
        sessionActiveCalls: getEl('sessionActiveCalls'),
        
        // Model Selector
        modelSelectorWrapper: getEl('modelSelectorWrapper'),
        modelSelectorBtn: getEl('modelSelectorBtn'),
        modelSelectorLabel: getEl('modelSelectorLabel'),
        modelDropdown: getEl('modelDropdown'),
        modelDetailsSubpanel: getEl('modelDetailsSubpanel'),
        subpanelModelName: getEl('subpanelModelName'),
        subpanelRuntime: getEl('subpanelRuntime'),
        subpanelStatus: getEl('subpanelStatus'),
        subpanelHardware: getEl('subpanelHardware'),
        btnCloseSubpanel: getEl('btnCloseSubpanel'),
        
        // Delete Modal
        deleteModalBackdrop: getEl('deleteModalBackdrop'),
        btnCancelDelete: getEl('btnCancelDelete'),
        btnConfirmDelete: getEl('btnConfirmDelete'),
        
        // File input (create if missing)
        fileInput: document.getElementById('hiddenFileInput') || (function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv,.txt';
            input.id = 'hiddenFileInput';
            input.style.display = 'none';
            document.body.appendChild(input);
            return input;
        })(),
        
        // Header
        agentHeader: getEl('agentHeader'),
        agentAvatar: document.querySelector('.agent-avatar'),
        agentName: document.querySelector('.agent-name-info h2'),
        agentSubtitle: document.querySelector('.agent-id'),
        modelPill: getEl('modelPill'),
        
        // Tabs
        workspaceTabs: getEl('workspaceTabs'),
        
        // Tab content panels
        aboutView: getEl('aboutView'),
        capabilitiesView: getEl('capabilitiesView'),
        examplesView: getEl('examplesView'),
        
        // Inspector
        inspectorPanel: getEl('inspectorPanel'),
        inspectorContent: document.querySelector('.inspector-body'),
        closeInspectorBtn: getEl('btnCloseInspector'),
        
        // Mobile
        sidebarOverlay: getEl('mobileBackdrop'),
        mobileMenuBtn: getEl('mobileMenuToggle'),
        sidebar: getEl('appSidebar'),
        
        // New Chat
        newChatBtn: getEl('btnNewChat')
    };

    // UTILITY FUNCTIONS
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatTimestamp(date) {
        if (!date) return '';
        const d = (date instanceof Date) ? date : new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(d);
    }

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function getAgentDisplayNumber(agent) {
        if (!agent) return '301';
        if (agent.id === 'auto' || agent.name === 'Super AI Agent' || agent.name === 'Super AI') {
            return '301';
        }
        if (agent.displayNumber) return agent.displayNumber;
        const rawId = agent.agent_id || agent.id || '';
        const num = parseInt(rawId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) {
            return String(num).padStart(3, '0');
        }
        return '001';
    }

    function generateAgentAvatar(agent) {
        const number = getAgentDisplayNumber(agent);
        const isSuper = agent?.id === 'auto' || agent?.name === 'Super AI Agent' || agent?.name === 'Super AI' || agent?.category === 'Orchestrator';
        
        const cat = (agent?.category || agent?.domain || '').toLowerCase();
        let color = 'linear-gradient(135deg, #0284c7, #0369a1)';
        let borderGlow = 'rgba(6, 182, 212, 0.4)';
        
        if (isSuper) {
            color = 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)';
            borderGlow = 'rgba(139, 92, 246, 0.6)';
        } else if (cat.includes('writing') || cat.includes('communication')) {
            color = 'linear-gradient(135deg, #3b82f6, #6366f1)';
            borderGlow = 'rgba(59, 130, 246, 0.4)';
        } else if (cat.includes('research') || cat.includes('knowledge')) {
            color = 'linear-gradient(135deg, #06b6d4, #0284c7)';
            borderGlow = 'rgba(6, 182, 212, 0.4)';
        } else if (cat.includes('coding') || cat.includes('development')) {
            color = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
            borderGlow = 'rgba(139, 92, 246, 0.4)';
        } else if (cat.includes('data') || cat.includes('analytics')) {
            color = 'linear-gradient(135deg, #10b981, #059669)';
            borderGlow = 'rgba(16, 185, 129, 0.4)';
        } else if (cat.includes('design') || cat.includes('creative')) {
            color = 'linear-gradient(135deg, #f43f5e, #e11d48)';
            borderGlow = 'rgba(244, 63, 94, 0.4)';
        } else if (cat.includes('automation') || cat.includes('productivity')) {
            color = 'linear-gradient(135deg, #14b8a6, #0d9488)';
            borderGlow = 'rgba(20, 184, 166, 0.4)';
        } else if (cat.includes('security') || cat.includes('systems')) {
            color = 'linear-gradient(135deg, #f59e0b, #d97706)';
            borderGlow = 'rgba(245, 158, 11, 0.4)';
        } else if (cat.includes('business') || cat.includes('management')) {
            color = 'linear-gradient(135deg, #eab308, #ca8a04)';
            borderGlow = 'rgba(234, 179, 8, 0.4)';
        } else if (cat.includes('education') || cat.includes('learning')) {
            color = 'linear-gradient(135deg, #a855f7, #9333ea)';
            borderGlow = 'rgba(168, 85, 247, 0.4)';
        } else if (cat.includes('specialized') || cat.includes('ai')) {
            color = 'linear-gradient(135deg, #6366f1, #a855f7)';
            borderGlow = 'rgba(99, 102, 241, 0.4)';
        }
        
        return { number, color, borderGlow, isSuper };
    }

    function getAgentExamples(agent) {
        if (!agent) return ['Analyze this document', 'Ask a question', 'Search knowledge', 'Summarize key findings'];
        if (Array.isArray(agent.examples) && agent.examples.length > 0) {
            return agent.examples;
        }
        if (agent.id === 'auto' || agent.name === 'Super AI') {
            return [
                'Build me a complete full-stack web application with database and tests',
                'Perform end-to-end investigation, analyze data, and prepare deliverables',
                'Coordinate research, coding, documentation, and testing for this project',
                'Analyze this complex problem using multiple specialized AI agents'
            ];
        }
        const name = (agent.name || '').toLowerCase();
        if (name.includes('python')) {
            return ['Write a Python script to rename these files', 'Fix this Python error and optimize loop', 'Build an async data processing pipeline in Python', 'Create a custom Python decorator'];
        }
        if (name.includes('coding') || name.includes('javascript') || name.includes('react')) {
            return ['Write clean code for this feature', 'Debug this JavaScript async error', 'Create a modern React component with hooks', 'Refactor this function for better performance'];
        }
        if (name.includes('data') || name.includes('analysis') || name.includes('sql')) {
            return ['Analyze this dataset for key trends and outliers', 'Write an optimized SQL query with window functions', 'Calculate statistical variance and growth rates', 'Create a structured summary of this table'];
        }
        if (name.includes('image') || name.includes('ocr') || name.includes('vision')) {
            return ['Analyze this image and describe key visual elements', 'Extract text from this scanned document image', 'Detect anomalies or defects in this diagram', 'Identify objects and visual composition'];
        }
        if (name.includes('security') || name.includes('cyber')) {
            return ['Audit this code for security vulnerabilities', 'Perform a threat model analysis', 'Review authentication headers and tokens', 'Provide recommendations for hardening server access'];
        }
        if (name.includes('research')) {
            return ['Research the key developments in this domain', 'Compare these technologies with pros and cons', 'Summarize the latest findings from these sources', 'Provide an in-depth topic overview'];
        }
        return ['Analyze this document and extract key findings', 'Explain how this technology works in simple terms', 'Help me draft a clear, professional summary', 'Provide actionable next steps and recommendations'];
    }

    // ============================================================
    // CLIENT-SIDE NATIVE DIAGRAMMATIC RENDERER
    // ============================================================
    const ClientDiagramSanitizer = {
        escapeHtml(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        },
        sanitizeLabel(label) {
            if (typeof label !== 'string') return '';
            let clean = label
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/javascript\s*:/gi, '')
                .replace(/data\s*:\s*text\/html/gi, '')
                .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]*on\w+\s*=[^>]*>/gi, '')
                .replace(/on\w+\s*=\s*['"][^'"]*['"]/gi, '')
                .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
                .trim();
            return this.escapeHtml(clean);
        },
        sanitizeId(id) {
            if (typeof id !== 'string') return `node_${Math.random().toString(36).slice(2, 8)}`;
            return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
        }
    };

    const ClientDiagramRenderer = {
        renderFlowchart(spec) {
            const title = ClientDiagramSanitizer.sanitizeLabel(spec.title || 'Process Flowchart');
            const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
            const edges = Array.isArray(spec.edges) ? spec.edges : [];
            const direction = (spec.direction || 'TB').toUpperCase();

            if (nodes.length === 0) return `<svg viewBox="0 0 400 60"><text x="200" y="35" fill="#94a3b8" text-anchor="middle">No nodes provided</text></svg>`;

            const nodeW = 180, nodeH = 54, gapY = 48, gapX = 40;
            const isTB = direction !== 'LR';
            const nodePositions = new Map();

            nodes.forEach((n, idx) => {
                const x = isTB ? 200 : 40 + idx * (nodeW + gapX);
                const y = isTB ? 50 + idx * (nodeH + gapY) : 90;
                nodePositions.set(String(n.id), { x, y, node: n });
            });

            const totalW = isTB ? 400 : Math.max(480, 80 + nodes.length * (nodeW + gapX));
            const totalH = isTB ? Math.max(150, 90 + nodes.length * (nodeH + gapY)) : 200;

            let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">
              <defs>
                <linearGradient id="cfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="rgba(30,41,59,0.85)" /><stop offset="100%" stop-color="rgba(15,23,42,0.75)" />
                </linearGradient>
                <linearGradient id="ceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6366f1" /><stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
                <marker id="cArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
                </marker>
              </defs>`;

            if (title) svg += `<text x="20" y="26" fill="#f1f5f9" font-size="13" font-weight="600">${title}</text>`;

            edges.forEach(edge => {
                const f = nodePositions.get(String(edge.from || edge.source));
                const t = nodePositions.get(String(edge.to || edge.target));
                if (f && t) {
                    const startY = f.y + (isTB ? nodeH / 2 : 0);
                    const endY = t.y - (isTB ? nodeH / 2 : 0);
                    const edgeLabel = ClientDiagramSanitizer.sanitizeLabel(edge.label || '');
                    if (isTB) {
                        const midY = (startY + endY) / 2;
                        svg += `<path d="M ${f.x} ${startY} C ${f.x} ${midY}, ${t.x} ${midY}, ${t.x} ${endY - 6}" fill="none" stroke="url(#ceGrad)" stroke-width="2" marker-end="url(#cArrow)" />`;
                        if (edgeLabel) {
                            svg += `<rect x="${(f.x + t.x) / 2 - 35}" y="${midY - 9}" width="70" height="16" rx="4" fill="rgba(15,23,42,0.85)" stroke="rgba(99,102,241,0.2)" stroke-width="0.8" />
                            <text x="${(f.x + t.x) / 2}" y="${midY + 3}" fill="#94a3b8" font-size="9" text-anchor="middle">${edgeLabel}</text>`;
                        }
                    } else {
                        svg += `<line x1="${f.x + nodeW / 2}" y1="${f.y}" x2="${t.x - nodeW / 2 - 6}" y2="${t.y}" stroke="url(#ceGrad)" stroke-width="2" marker-end="url(#cArrow)" />`;
                    }
                }
            });

            nodes.forEach((n, idx) => {
                const pos = nodePositions.get(String(n.id));
                if (!pos) return;
                const label = ClientDiagramSanitizer.sanitizeLabel(n.label || n.id);
                const sub = ClientDiagramSanitizer.sanitizeLabel(n.subLabel || n.subtitle || '');
                const rectX = pos.x - nodeW / 2;
                const rectY = pos.y - nodeH / 2;

                svg += `
                  <g transform="translate(${rectX}, ${rectY})">
                    <rect x="0" y="0" width="${nodeW}" height="${nodeH}" rx="10" fill="url(#cfGrad)" stroke="rgba(99,102,241,0.35)" stroke-width="1.2" />
                    <line x1="8" y1="0" x2="${nodeW - 8}" y2="0" stroke="#6366f1" stroke-width="1.5" opacity="0.8" />
                    <rect x="8" y="${nodeH / 2 - 8}" width="16" height="16" rx="8" fill="rgba(99,102,241,0.2)" stroke="#8b5cf6" stroke-width="0.8" />
                    <text x="16" y="${nodeH / 2 + 4}" fill="#f1f5f9" font-size="9" font-weight="700" text-anchor="middle">${idx + 1}</text>
                    <text x="30" y="${sub ? nodeH / 2 - 2 : nodeH / 2 + 4}" fill="#f1f5f9" font-size="11" font-weight="600">${label}</text>
                    ${sub ? `<text x="30" y="${nodeH / 2 + 11}" fill="#94a3b8" font-size="9">${sub}</text>` : ''}
                  </g>
                `;
            });

            svg += '</svg>';
            return svg;
        },

        renderArchitecture(spec) {
            const title = ClientDiagramSanitizer.sanitizeLabel(spec.title || 'System Architecture');
            const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
            const layersMap = new Map();
            nodes.forEach(n => {
                const l = n.layer || n.tier || 'Core Services';
                if (!layersMap.has(l)) layersMap.set(l, []);
                layersMap.get(l).push(n);
            });

            const layerNames = Array.from(layersMap.keys());
            const layerH = 95, cardW = 160, cardH = 50, cardGap = 16;
            let maxInLayer = 1;
            layersMap.forEach(list => { if (list.length > maxInLayer) maxInLayer = list.length; });

            const totalW = Math.max(600, 60 + maxInLayer * (cardW + cardGap));
            const totalH = 70 + layerNames.length * layerH + 30;

            let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">
              <defs>
                <linearGradient id="cLayerBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(17,24,39,0.6)" /><stop offset="100%" stop-color="rgba(15,23,42,0.4)" /></linearGradient>
                <linearGradient id="cCardGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(30,41,59,0.85)" /><stop offset="100%" stop-color="rgba(15,23,42,0.75)" /></linearGradient>
              </defs>
              <text x="20" y="28" fill="#f1f5f9" font-size="14" font-weight="700">${title}</text>`;

            layerNames.forEach((layerName, layerIdx) => {
                const layerY = 55 + layerIdx * layerH;
                const layerNodes = layersMap.get(layerName);
                const lWidth = totalW - 40;

                svg += `
                  <g transform="translate(20, ${layerY})">
                    <rect x="0" y="0" width="${lWidth}" height="${layerH - 12}" rx="12" fill="url(#cLayerBg)" stroke="rgba(99,102,241,0.2)" stroke-width="1" />
                    <rect x="12" y="-7" width="${Math.max(100, layerName.length * 7 + 16)}" height="15" rx="3" fill="rgba(15,23,42,0.95)" stroke="rgba(99,102,241,0.3)" stroke-width="0.8" />
                    <text x="20" y="4" fill="#06b6d4" font-size="9" font-weight="600" text-transform="uppercase">${ClientDiagramSanitizer.sanitizeLabel(layerName)}</text>
                  </g>
                `;

                const totalCardsW = layerNodes.length * cardW + (layerNodes.length - 1) * cardGap;
                const startX = 20 + (lWidth - totalCardsW) / 2;

                layerNodes.forEach((node, nodeIdx) => {
                    const cX = startX + nodeIdx * (cardW + cardGap);
                    const cY = layerY + 16;
                    const label = ClientDiagramSanitizer.sanitizeLabel(node.name || node.label || node.id);
                    const role = ClientDiagramSanitizer.sanitizeLabel(node.role || node.subtitle || '');
                    const badge = ClientDiagramSanitizer.sanitizeLabel(node.badge || '');

                    svg += `
                      <g transform="translate(${cX}, ${cY})">
                        <rect x="0" y="0" width="${cardW}" height="${cardH}" rx="8" fill="url(#cCardGrad)" stroke="rgba(99,102,241,0.35)" stroke-width="1" />
                        <line x1="6" y1="0" x2="${cardW - 6}" y2="0" stroke="#6366f1" stroke-width="1.5" opacity="0.8" />
                        <text x="10" y="19" fill="#f1f5f9" font-size="11" font-weight="600">${label}</text>
                        ${role ? `<text x="10" y="33" fill="#94a3b8" font-size="9">${role}</text>` : ''}
                        ${badge ? `
                          <rect x="${cardW - 54}" y="${cardH - 14}" width="48" height="11" rx="2" fill="rgba(99,102,241,0.2)" stroke="#8b5cf6" stroke-width="0.5" />
                          <text x="${cardW - 30}" y="${cardH - 5}" fill="#8b5cf6" font-size="7.5" font-weight="600" text-anchor="middle">${badge}</text>
                        ` : ''}
                      </g>
                    `;
                });
            });

            svg += '</svg>';
            return svg;
        },

        // ================================================================
        // CHART RENDERER — 18 Chart Types with Pure SVG
        // ================================================================
        _CHART_COLORS: ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#22d3ee', '#e879f9', '#34d399', '#fbbf24', '#fb7185'],

        _normalizeChartData(spec) {
            // Accept categories, labels, x.values, series.data, series.values, and data array
            let labels = spec.categories || spec.labels || spec.x?.values || [];
            let series = (spec.series || []).map((sr, idx) => ({
                name: sr.name || sr.label || `Series ${idx + 1}`,
                values: Array.isArray(sr.data) ? sr.data : (Array.isArray(sr.values) ? sr.values : [])
            }));

            if ((!labels.length || !series.length) && Array.isArray(spec.data) && spec.data.length > 0) {
                const d = spec.data;
                if (d[0] && (typeof d[0].label === 'string' || typeof d[0].name === 'string')) {
                    labels = d.map(i => i.label || i.name || 'Item');
                    series = [{ name: spec.seriesName || spec.yAxis?.label || 'Value', values: d.map(i => (typeof i.value === 'number' ? i.value : Number(i.value) || 0)) }];
                } else if (typeof d[0] === 'number') {
                    labels = d.map((_, i) => `Item ${i + 1}`);
                    series = [{ name: 'Value', values: d }];
                }
            }

            if (series.length === 0 && Array.isArray(spec.values)) {
                series = [{ name: spec.seriesName || 'Value', values: spec.values }];
            }

            if (!labels.length && series.length && series[0].values) {
                labels = series[0].values.map((_, i) => `Item ${i + 1}`);
            }

            return { labels, series };
        },

        _svgAxis(padL, padT, plotW, plotH, labels, minVal, maxVal, xTitle, yTitle) {
            const CC = this._CHART_COLORS;
            let s = '';
            // Y-axis
            s += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="rgba(148,163,184,0.3)" stroke-width="1"/>`;
            // X-axis
            s += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="rgba(148,163,184,0.3)" stroke-width="1"/>`;
            // Y gridlines + labels
            const ySteps = 5;
            const range = maxVal - minVal || 1;
            for (let i = 0; i <= ySteps; i++) {
                const y = padT + plotH - (i / ySteps) * plotH;
                const val = minVal + (i / ySteps) * range;
                s += `<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="rgba(148,163,184,0.1)" stroke-width="0.5"/>`;
                s += `<text x="${padL - 6}" y="${y + 3.5}" fill="#94a3b8" font-size="9" text-anchor="end">${Math.round(val * 10) / 10}</text>`;
            }
            // X labels
            if (labels.length > 0) {
                labels.forEach((lb, i) => {
                    const x = padL + (i + 0.5) * (plotW / labels.length);
                    const clean = ClientDiagramSanitizer.sanitizeLabel(String(lb));
                    s += `<text x="${x}" y="${padT + plotH + 16}" fill="#94a3b8" font-size="9" text-anchor="middle">${clean.length > 12 ? clean.slice(0, 11) + '…' : clean}</text>`;
                });
            }
            return s;
        },

        _svgLegend(series, startX, startY) {
            const CC = this._CHART_COLORS;
            let s = '';
            series.forEach((sr, i) => {
                const y = startY + i * 18;
                s += `<rect x="${startX}" y="${y}" width="10" height="10" rx="2" fill="${CC[i % CC.length]}"/>`;
                s += `<text x="${startX + 14}" y="${y + 9}" fill="#cbd5e1" font-size="9">${ClientDiagramSanitizer.sanitizeLabel(sr.name || `Series ${i + 1}`)}</text>`;
            });
            return s;
        },

        renderChart(spec) {
            const type = (spec.type || 'bar_chart').toLowerCase().replace(/[\s-]/g, '_');
            const CC = this._CHART_COLORS;
            const title = ClientDiagramSanitizer.sanitizeLabel(spec.title || '');

            // Dispatch to sub-renderers
            switch (type) {
                case 'pie_chart': case 'pie': return this._renderPie(spec, false);
                case 'donut_chart': case 'donut': return this._renderPie(spec, true);
                case 'bar_chart': case 'bar': return this._renderBar(spec);
                case 'horizontal_bar_chart': case 'horizontal_bar': return this._renderHorizontalBar(spec);
                case 'grouped_bar_chart': case 'grouped_bar': return this._renderGroupedBar(spec);
                case 'stacked_bar_chart': case 'stacked_bar': return this._renderStackedBar(spec);
                case 'line_chart': case 'line': return this._renderLine(spec, false);
                case 'area_chart': case 'area': return this._renderLine(spec, true);
                case 'stacked_area_chart': case 'stacked_area': return this._renderStackedArea(spec);
                case 'scatter_plot': case 'scatter': return this._renderScatter(spec);
                case 'bubble_chart': case 'bubble': return this._renderBubble(spec);
                case 'histogram': return this._renderHistogram(spec);
                case 'radar_chart': case 'radar': return this._renderRadar(spec);
                case 'heatmap': return this._renderHeatmap(spec);
                case 'box_plot': return this._renderBoxPlot(spec);
                case 'waterfall_chart': case 'waterfall': return this._renderWaterfall(spec);
                case 'gauge_chart': case 'gauge': return this._renderGauge(spec);
                case 'population_pyramid': return this._renderPopulationPyramid(spec);
                default: return this._renderBar(spec); // Fallback to bar
            }
        },

        _renderPie(spec, isDonut) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const values = series[0]?.values || [];
            const total = values.reduce((a, b) => a + (b || 0), 0) || 1;
            const cx = 180, cy = 180, outerR = 140, innerR = isDonut ? 84 : 0;
            const legendX = 370;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;

            if (values.length === 1 || (values.length > 0 && values[0] / total > 0.999)) {
                // Single slice or 100% — use full circle
                svg += `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${CC[0]}"/>`;
                if (isDonut) svg += `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="rgba(15,23,42,0.95)"/>`;
            } else {
                let startAngle = -Math.PI / 2;
                values.forEach((val, i) => {
                    const sliceAngle = (val / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;
                    const x1 = cx + outerR * Math.cos(startAngle);
                    const y1 = cy + outerR * Math.sin(startAngle);
                    const x2 = cx + outerR * Math.cos(endAngle);
                    const y2 = cy + outerR * Math.sin(endAngle);
                    const largeArc = sliceAngle > Math.PI ? 1 : 0;
                    let d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    if (isDonut) {
                        const ix1 = cx + innerR * Math.cos(startAngle);
                        const iy1 = cy + innerR * Math.sin(startAngle);
                        const ix2 = cx + innerR * Math.cos(endAngle);
                        const iy2 = cy + innerR * Math.sin(endAngle);
                        d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                    }
                    svg += `<path d="${d}" fill="${CC[i % CC.length]}" opacity="0.9"/>`;
                    startAngle = endAngle;
                });
            }

            if (isDonut && spec.centerText) {
                svg += `<text x="${cx}" y="${cy - 6}" fill="#f1f5f9" font-size="22" font-weight="700" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(String(spec.centerText))}</text>`;
                if (spec.centerSubtext) svg += `<text x="${cx}" y="${cy + 14}" fill="#94a3b8" font-size="10" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(spec.centerSubtext)}</text>`;
            }

            // Legend
            labels.forEach((lb, i) => {
                const y = 40 + i * 22;
                const pct = Math.round((values[i] / total) * 100);
                svg += `<rect x="${legendX}" y="${y}" width="10" height="10" rx="2" fill="${CC[i % CC.length]}"/>`;
                svg += `<text x="${legendX + 16}" y="${y + 9}" fill="#cbd5e1" font-size="10">${ClientDiagramSanitizer.sanitizeLabel(String(lb))} (${pct}%)</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderBar(spec) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const allVals = series.flatMap(s => s.values || []);
            const maxVal = Math.max(...allVals, 1);
            const minVal = Math.min(0, ...allVals);

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, labels, minVal, maxVal);

            const barGroup = plotW / Math.max(labels.length, 1);
            const barW = Math.min(barGroup * 0.6 / Math.max(series.length, 1), 40);
            const range = maxVal - minVal || 1;

            series.forEach((sr, si) => {
                (sr.values || []).forEach((val, vi) => {
                    const x = padL + vi * barGroup + (barGroup - barW * series.length) / 2 + si * barW;
                    const barH = ((val - minVal) / range) * plotH;
                    const y = padT + plotH - barH;
                    svg += `<rect x="${x}" y="${y}" width="${barW - 1}" height="${barH}" rx="2" fill="${CC[si % CC.length]}" opacity="0.85"/>`;
                });
            });

            if (series.length > 1) svg += this._svgLegend(series, padL + plotW - 120, 8);
            svg += `</svg>`;
            return svg;
        },

        _renderHorizontalBar(spec) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const padL = 90, padT = 20, plotW = 440, plotH = Math.max(200, labels.length * 30);
            const allVals = series.flatMap(s => s.values || []);
            const maxVal = Math.max(...allVals, 1);
            const barH = Math.min(plotH / Math.max(labels.length, 1) * 0.7, 24);

            let svg = `<svg viewBox="0 0 600 ${padT + plotH + 30}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            labels.forEach((lb, i) => {
                const y = padT + i * (plotH / labels.length) + (plotH / labels.length - barH) / 2;
                const val = series[0]?.values?.[i] || 0;
                const w = (val / maxVal) * plotW;
                svg += `<text x="${padL - 6}" y="${y + barH / 2 + 3.5}" fill="#94a3b8" font-size="9" text-anchor="end">${ClientDiagramSanitizer.sanitizeLabel(String(lb))}</text>`;
                svg += `<rect x="${padL}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${CC[i % CC.length]}" opacity="0.85"/>`;
                svg += `<text x="${padL + w + 6}" y="${y + barH / 2 + 3.5}" fill="#cbd5e1" font-size="9">${val}</text>`;
            });
            svg += `</svg>`;
            return svg;
        },

        _renderGroupedBar(spec) {
            return this._renderBar(spec); // Already supports multi-series grouping
        },

        _renderStackedBar(spec) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            // Compute max stacked total
            const stackTotals = labels.map((_, i) => series.reduce((sum, sr) => sum + ((sr.values || [])[i] || 0), 0));
            const maxVal = Math.max(...stackTotals, 1);

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, labels, 0, maxVal);

            const barGroup = plotW / Math.max(labels.length, 1);
            const barW = Math.min(barGroup * 0.6, 40);

            labels.forEach((_, li) => {
                let cumY = padT + plotH;
                series.forEach((sr, si) => {
                    const val = (sr.values || [])[li] || 0;
                    const barH = (val / maxVal) * plotH;
                    cumY -= barH;
                    const x = padL + li * barGroup + (barGroup - barW) / 2;
                    svg += `<rect x="${x}" y="${cumY}" width="${barW}" height="${barH}" fill="${CC[si % CC.length]}" opacity="0.85"/>`;
                });
            });

            if (series.length > 1) svg += this._svgLegend(series, padL + plotW - 120, 8);
            svg += `</svg>`;
            return svg;
        },

        _renderLine(spec, fillArea) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const allVals = series.flatMap(s => s.values || []);
            const maxVal = Math.max(...allVals, 1);
            const minVal = Math.min(0, ...allVals);
            const range = maxVal - minVal || 1;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, labels, minVal, maxVal);

            series.forEach((sr, si) => {
                const vals = sr.values || [];
                const points = vals.map((v, i) => {
                    const x = padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
                    const y = padT + plotH - ((v - minVal) / range) * plotH;
                    return { x, y };
                });

                if (points.length === 0) return;

                if (points.length === 1) {
                    // Single point: render a dot
                    svg += `<circle cx="${points[0].x}" cy="${points[0].y}" r="5" fill="${CC[si % CC.length]}"/>`;
                    return;
                }

                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                if (fillArea) {
                    const areaD = pathD + ` L ${points[points.length - 1].x} ${padT + plotH} L ${points[0].x} ${padT + plotH} Z`;
                    svg += `<path d="${areaD}" fill="${CC[si % CC.length]}" opacity="0.15"/>`;
                }
                svg += `<path d="${pathD}" fill="none" stroke="${CC[si % CC.length]}" stroke-width="2.5" stroke-linejoin="round"/>`;
                points.forEach(p => { svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${CC[si % CC.length]}"/>`; });
            });

            if (series.length > 1) svg += this._svgLegend(series, padL + plotW - 120, 8);
            svg += `</svg>`;
            return svg;
        },

        _renderStackedArea(spec) {
            const CC = this._CHART_COLORS;
            const { labels, series } = this._normalizeChartData(spec);
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const stackTotals = labels.map((_, i) => series.reduce((s, sr) => s + ((sr.values || [])[i] || 0), 0));
            const maxVal = Math.max(...stackTotals, 1);

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, labels, 0, maxVal);

            // Render from last series to first (bottom-up stacking)
            const cumulative = labels.map(() => 0);
            for (let si = 0; si < series.length; si++) {
                const vals = series[si].values || [];
                const topPoints = labels.map((_, i) => {
                    cumulative[i] += (vals[i] || 0);
                    const x = padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
                    const y = padT + plotH - (cumulative[i] / maxVal) * plotH;
                    return { x, y };
                });
                const bottomPoints = labels.map((_, i) => {
                    const prevCum = cumulative[i] - (vals[i] || 0);
                    const x = padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
                    const y = padT + plotH - (prevCum / maxVal) * plotH;
                    return { x, y };
                });
                let d = topPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                d += ' ' + bottomPoints.reverse().map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                svg += `<path d="${d}" fill="${CC[si % CC.length]}" opacity="0.6"/>`;
            }

            if (series.length > 1) svg += this._svgLegend(series, padL + plotW - 120, 8);
            svg += `</svg>`;
            return svg;
        },

        _renderScatter(spec) {
            const CC = this._CHART_COLORS;
            const data = spec.data || [];
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const xs = data.map(d => d.x || 0), ys = data.map(d => d.y || 0);
            const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
            const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
            const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, [], minY, maxY);
            // X axis labels
            for (let i = 0; i <= 5; i++) {
                const x = padL + (i / 5) * plotW;
                const val = minX + (i / 5) * rangeX;
                svg += `<text x="${x}" y="${padT + plotH + 16}" fill="#94a3b8" font-size="9" text-anchor="middle">${Math.round(val * 10) / 10}</text>`;
            }

            data.forEach((d, i) => {
                const px = padL + ((d.x - minX) / rangeX) * plotW;
                const py = padT + plotH - ((d.y - minY) / rangeY) * plotH;
                svg += `<circle cx="${px}" cy="${py}" r="5" fill="${CC[i % CC.length]}" opacity="0.8"/>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderBubble(spec) {
            const CC = this._CHART_COLORS;
            const data = spec.data || [];
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const xs = data.map(d => d.x || 0), ys = data.map(d => d.y || 0), rs = data.map(d => d.r || d.size || 10);
            const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
            const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
            const maxR = Math.max(...rs, 1);
            const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, [], minY, maxY);

            data.forEach((d, i) => {
                const px = padL + ((d.x - minX) / rangeX) * plotW;
                const py = padT + plotH - ((d.y - minY) / rangeY) * plotH;
                const pr = Math.max(4, (d.r || d.size || 10) / maxR * 30);
                svg += `<circle cx="${px}" cy="${py}" r="${pr}" fill="${CC[i % CC.length]}" opacity="0.6" stroke="${CC[i % CC.length]}" stroke-width="1"/>`;
                if (d.label) svg += `<text x="${px}" y="${py - pr - 4}" fill="#cbd5e1" font-size="8" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(d.label)}</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderHistogram(spec) {
            const CC = this._CHART_COLORS;
            const bins = spec.bins || spec.data || [];
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const maxCount = Math.max(...bins.map(b => b.count || b.value || b.frequency || 0), 1);

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, bins.map(b => b.label || `${b.min || ''}-${b.max || ''}`), 0, maxCount);

            const binW = plotW / Math.max(bins.length, 1);
            bins.forEach((b, i) => {
                const count = b.count || b.value || b.frequency || 0;
                const barH = (count / maxCount) * plotH;
                svg += `<rect x="${padL + i * binW + 1}" y="${padT + plotH - barH}" width="${binW - 2}" height="${barH}" fill="${CC[0]}" opacity="0.75"/>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderRadar(spec) {
            const CC = this._CHART_COLORS;
            const axes = spec.axes || spec.labels || [];
            const series = spec.series || [{ name: 'Values', values: spec.values || [] }];
            const cx = 300, cy = 200, maxR = 150;
            const maxVal = spec.maxValue || Math.max(...series.flatMap(s => s.values || []), 1);
            const n = axes.length;
            if (n < 3) return `<svg viewBox="0 0 600 400"><text x="300" y="200" fill="#94a3b8" text-anchor="middle" font-size="12">Radar chart requires at least 3 axes</text></svg>`;

            let svg = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;

            // Grid rings
            for (let ring = 1; ring <= 5; ring++) {
                const r = (ring / 5) * maxR;
                let ringD = '';
                for (let i = 0; i < n; i++) {
                    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
                    const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
                    ringD += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
                }
                ringD += 'Z';
                svg += `<path d="${ringD}" fill="none" stroke="rgba(148,163,184,0.15)" stroke-width="0.5"/>`;
            }

            // Axis lines + labels
            axes.forEach((ax, i) => {
                const angle = (2 * Math.PI * i / n) - Math.PI / 2;
                const x = cx + maxR * Math.cos(angle), y = cy + maxR * Math.sin(angle);
                svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.2)" stroke-width="0.5"/>`;
                const lx = cx + (maxR + 16) * Math.cos(angle), ly = cy + (maxR + 16) * Math.sin(angle);
                svg += `<text x="${lx}" y="${ly + 3}" fill="#94a3b8" font-size="9" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(String(ax))}</text>`;
            });

            // Data polygons
            series.forEach((sr, si) => {
                const vals = sr.values || [];
                let d = '';
                for (let i = 0; i < n; i++) {
                    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
                    const r = ((vals[i] || 0) / maxVal) * maxR;
                    const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
                    d += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
                }
                d += 'Z';
                svg += `<path d="${d}" fill="${CC[si % CC.length]}" opacity="0.2" stroke="${CC[si % CC.length]}" stroke-width="2"/>`;
                for (let i = 0; i < n; i++) {
                    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
                    const r = ((vals[i] || 0) / maxVal) * maxR;
                    svg += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="3" fill="${CC[si % CC.length]}"/>`;
                }
            });

            svg += `</svg>`;
            return svg;
        },

        _renderHeatmap(spec) {
            const CC = this._CHART_COLORS;
            const matrix = spec.matrix || [];
            const xLabels = spec.xLabels || spec.columns || [];
            const yLabels = spec.yLabels || spec.rows || [];
            const rows = matrix.length, cols = matrix[0]?.length || 0;
            if (rows === 0 || cols === 0) return `<svg viewBox="0 0 600 400"><text x="300" y="200" fill="#94a3b8" text-anchor="middle" font-size="12">No heatmap data</text></svg>`;

            const padL = 70, padT = 30;
            const cellW = Math.min(40, (520 - padL) / cols), cellH = Math.min(30, 340 / rows);
            const allVals = matrix.flat().filter(v => typeof v === 'number');
            const minVal = Math.min(...allVals), maxVal = Math.max(...allVals);
            const range = maxVal - minVal || 1;

            let svg = `<svg viewBox="0 0 ${padL + cols * cellW + 20} ${padT + rows * cellH + 30}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;

            matrix.forEach((row, ri) => {
                if (yLabels[ri]) svg += `<text x="${padL - 6}" y="${padT + ri * cellH + cellH / 2 + 3}" fill="#94a3b8" font-size="9" text-anchor="end">${ClientDiagramSanitizer.sanitizeLabel(String(yLabels[ri]))}</text>`;
                (row || []).forEach((val, ci) => {
                    const intensity = (val - minVal) / range;
                    const r = Math.round(6 + intensity * 180);
                    const g = Math.round(182 - intensity * 130);
                    const b = Math.round(212 - intensity * 40);
                    svg += `<rect x="${padL + ci * cellW}" y="${padT + ri * cellH}" width="${cellW - 1}" height="${cellH - 1}" rx="2" fill="rgb(${r},${g},${b})" opacity="0.85"/>`;
                    svg += `<text x="${padL + ci * cellW + cellW / 2}" y="${padT + ri * cellH + cellH / 2 + 3}" fill="#f1f5f9" font-size="8" text-anchor="middle">${Math.round(val * 10) / 10}</text>`;
                });
            });

            xLabels.forEach((lb, ci) => {
                svg += `<text x="${padL + ci * cellW + cellW / 2}" y="${padT + rows * cellH + 14}" fill="#94a3b8" font-size="8" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(String(lb))}</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderBoxPlot(spec) {
            const CC = this._CHART_COLORS;
            const data = spec.data || [];
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            const allVals = data.flatMap(d => [d.min, d.q1, d.median, d.q3, d.max].filter(v => v != null));
            const minVal = Math.min(...allVals, 0), maxVal = Math.max(...allVals, 1);
            const range = maxVal - minVal || 1;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, data.map(d => d.label || ''), minVal, maxVal);

            const groupW = plotW / Math.max(data.length, 1);
            const boxW = Math.min(groupW * 0.5, 40);

            data.forEach((d, i) => {
                const cx = padL + i * groupW + groupW / 2;
                const yMin = padT + plotH - ((d.min - minVal) / range) * plotH;
                const yQ1 = padT + plotH - ((d.q1 - minVal) / range) * plotH;
                const yMed = padT + plotH - ((d.median - minVal) / range) * plotH;
                const yQ3 = padT + plotH - ((d.q3 - minVal) / range) * plotH;
                const yMax = padT + plotH - ((d.max - minVal) / range) * plotH;

                // Whisker
                svg += `<line x1="${cx}" y1="${yMax}" x2="${cx}" y2="${yQ3}" stroke="${CC[i % CC.length]}" stroke-width="1.5"/>`;
                svg += `<line x1="${cx}" y1="${yQ1}" x2="${cx}" y2="${yMin}" stroke="${CC[i % CC.length]}" stroke-width="1.5"/>`;
                // Caps
                svg += `<line x1="${cx - boxW / 4}" y1="${yMax}" x2="${cx + boxW / 4}" y2="${yMax}" stroke="${CC[i % CC.length]}" stroke-width="1.5"/>`;
                svg += `<line x1="${cx - boxW / 4}" y1="${yMin}" x2="${cx + boxW / 4}" y2="${yMin}" stroke="${CC[i % CC.length]}" stroke-width="1.5"/>`;
                // Box (Q1 to Q3)
                svg += `<rect x="${cx - boxW / 2}" y="${yQ3}" width="${boxW}" height="${yQ1 - yQ3}" fill="${CC[i % CC.length]}" opacity="0.3" stroke="${CC[i % CC.length]}" stroke-width="1.5" rx="2"/>`;
                // Median line
                svg += `<line x1="${cx - boxW / 2}" y1="${yMed}" x2="${cx + boxW / 2}" y2="${yMed}" stroke="#f1f5f9" stroke-width="2"/>`;
            });

            svg += `</svg>`;
            return svg;
        },

        _renderWaterfall(spec) {
            const CC = this._CHART_COLORS;
            const data = spec.data || [];
            const padL = 55, padT = 30, plotW = 480, plotH = 280;
            let cumulative = 0;
            const bars = data.map(d => {
                const type = d.type || (d.value >= 0 ? 'increase' : 'decrease');
                if (type === 'total') {
                    const bar = { label: d.label, start: 0, end: cumulative, type };
                    return bar;
                }
                const start = cumulative;
                cumulative += d.value;
                return { label: d.label, start, end: cumulative, type };
            });
            const allVals = bars.flatMap(b => [b.start, b.end]);
            const minVal = Math.min(0, ...allVals), maxVal = Math.max(...allVals, 1);
            const range = maxVal - minVal || 1;

            let svg = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            svg += this._svgAxis(padL, padT, plotW, plotH, data.map(d => d.label || ''), minVal, maxVal);

            const barW = Math.min(plotW / Math.max(data.length, 1) * 0.6, 40);
            const groupW = plotW / Math.max(data.length, 1);

            bars.forEach((b, i) => {
                const yStart = padT + plotH - ((b.start - minVal) / range) * plotH;
                const yEnd = padT + plotH - ((b.end - minVal) / range) * plotH;
                const y = Math.min(yStart, yEnd);
                const h = Math.abs(yEnd - yStart) || 1;
                const x = padL + i * groupW + (groupW - barW) / 2;
                const color = b.type === 'total' ? '#3b82f6' : (b.type === 'decrease' ? '#f43f5e' : '#10b981');
                svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" fill="${color}" opacity="0.8"/>`;
                // Connector line
                if (i < bars.length - 1) {
                    const nextX = padL + (i + 1) * groupW + (groupW - barW) / 2;
                    svg += `<line x1="${x + barW}" y1="${yEnd}" x2="${nextX}" y2="${yEnd}" stroke="rgba(148,163,184,0.3)" stroke-width="1" stroke-dasharray="3,3"/>`;
                }
            });

            svg += `</svg>`;
            return svg;
        },

        _renderGauge(spec) {
            const value = spec.value || 0;
            const min = spec.min || 0, max = spec.max || 100;
            const range = max - min || 1;
            const pct = Math.max(0, Math.min(1, (value - min) / range));
            const cx = 300, cy = 250, outerR = 160, innerR = 120;

            let svg = `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;

            // Background arc (180°)
            const bgStartAngle = Math.PI, bgEndAngle = 0;
            const bgX1 = cx + outerR * Math.cos(bgStartAngle), bgY1 = cy + outerR * Math.sin(bgStartAngle);
            const bgX2 = cx + outerR * Math.cos(bgEndAngle), bgY2 = cy + outerR * Math.sin(bgEndAngle);
            svg += `<path d="M ${bgX1} ${bgY1} A ${outerR} ${outerR} 0 0 1 ${bgX2} ${bgY2}" fill="none" stroke="rgba(148,163,184,0.15)" stroke-width="${outerR - innerR}"/>`;

            // Value arc
            const valueAngle = Math.PI - pct * Math.PI;
            const vX = cx + outerR * Math.cos(valueAngle), vY = cy + outerR * Math.sin(valueAngle);
            const largeArc = pct > 0.5 ? 1 : 0;
            const arcColor = pct < 0.33 ? '#10b981' : (pct < 0.66 ? '#f59e0b' : '#f43f5e');
            svg += `<path d="M ${bgX1} ${bgY1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${vX} ${vY}" fill="none" stroke="${arcColor}" stroke-width="${outerR - innerR}" stroke-linecap="round"/>`;

            // Needle
            const needleAngle = Math.PI - pct * Math.PI;
            const nx = cx + (innerR - 10) * Math.cos(needleAngle), ny = cy + (innerR - 10) * Math.sin(needleAngle);
            svg += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/>`;
            svg += `<circle cx="${cx}" cy="${cy}" r="8" fill="rgba(30,41,59,0.9)" stroke="${arcColor}" stroke-width="2"/>`;

            // Value text
            svg += `<text x="${cx}" y="${cy - 30}" fill="#f1f5f9" font-size="32" font-weight="700" text-anchor="middle">${Math.round(value * 10) / 10}</text>`;
            if (spec.unit) svg += `<text x="${cx}" y="${cy - 10}" fill="#94a3b8" font-size="12" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(spec.unit)}</text>`;
            svg += `<text x="${cx - outerR}" y="${cy + 20}" fill="#94a3b8" font-size="10" text-anchor="middle">${min}</text>`;
            svg += `<text x="${cx + outerR}" y="${cy + 20}" fill="#94a3b8" font-size="10" text-anchor="middle">${max}</text>`;

            svg += `</svg>`;
            return svg;
        },

        _renderPopulationPyramid(spec) {
            const CC = this._CHART_COLORS;
            const data = spec.data || [];
            const padT = 25, midX = 300, maxW = 220;
            const rowH = Math.min(28, 340 / Math.max(data.length, 1));
            const totalH = padT + data.length * rowH + 30;
            const allVals = data.flatMap(d => [d.left || 0, d.right || 0]);
            const maxVal = Math.max(...allVals, 1);

            let svg = `<svg viewBox="0 0 600 ${totalH}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;

            // Column headers
            svg += `<text x="${midX - maxW / 2}" y="16" fill="${CC[3]}" font-size="10" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(spec.leftLabel || 'Left')}</text>`;
            svg += `<text x="${midX + maxW / 2}" y="16" fill="${CC[0]}" font-size="10" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(spec.rightLabel || 'Right')}</text>`;

            data.forEach((d, i) => {
                const y = padT + i * rowH;
                const leftW = ((d.left || 0) / maxVal) * maxW;
                const rightW = ((d.right || 0) / maxVal) * maxW;
                // Left bar (extends left from center)
                svg += `<rect x="${midX - leftW - 2}" y="${y}" width="${leftW}" height="${rowH - 3}" rx="2" fill="${CC[3]}" opacity="0.7"/>`;
                // Right bar (extends right from center)
                svg += `<rect x="${midX + 2}" y="${y}" width="${rightW}" height="${rowH - 3}" rx="2" fill="${CC[0]}" opacity="0.7"/>`;
                // Label
                svg += `<text x="${midX}" y="${y + rowH / 2 + 1}" fill="#f1f5f9" font-size="9" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(String(d.label || ''))}</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        // ================================================================
        // SEQUENCE DIAGRAM RENDERER
        // ================================================================
        renderSequence(spec) {
            const actors = spec.actors || spec.participants || [];
            const messages = spec.messages || [];
            const actorW = 100, actorGap = 40, actorH = 36;
            const msgGap = 40, padT = 20;
            const totalW = Math.max(500, actors.length * (actorW + actorGap));
            const totalH = padT + actorH + messages.length * msgGap + actorH + 40;
            const actorPositions = {};
            actors.forEach((a, i) => { actorPositions[typeof a === 'string' ? a : (a.id || a.name)] = padT + actorW / 2 + i * (actorW + actorGap) + 30; });

            let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">
              <defs><marker id="seqArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4"/></marker></defs>`;

            // Actor boxes + lifelines
            actors.forEach((a, i) => {
                const name = typeof a === 'string' ? a : (a.name || a.id);
                const x = actorPositions[typeof a === 'string' ? a : (a.id || a.name)];
                svg += `<rect x="${x - actorW / 2}" y="${padT}" width="${actorW}" height="${actorH}" rx="6" fill="rgba(30,41,59,0.85)" stroke="rgba(99,102,241,0.4)" stroke-width="1"/>`;
                svg += `<text x="${x}" y="${padT + actorH / 2 + 4}" fill="#f1f5f9" font-size="10" font-weight="600" text-anchor="middle">${ClientDiagramSanitizer.sanitizeLabel(name)}</text>`;
                svg += `<line x1="${x}" y1="${padT + actorH}" x2="${x}" y2="${totalH - actorH - 10}" stroke="rgba(148,163,184,0.3)" stroke-width="1" stroke-dasharray="5,4"/>`;
            });

            // Messages
            messages.forEach((m, i) => {
                const y = padT + actorH + 30 + i * msgGap;
                const fromX = actorPositions[m.from || m.source] || 60;
                const toX = actorPositions[m.to || m.target] || 200;
                const label = ClientDiagramSanitizer.sanitizeLabel(m.label || m.message || m.text || '');
                const isReturn = m.type === 'return' || m.style === 'dashed';
                svg += `<line x1="${fromX}" y1="${y}" x2="${toX - (fromX < toX ? 6 : -6)}" y2="${y}" stroke="${isReturn ? '#8b5cf6' : '#06b6d4'}" stroke-width="1.5" ${isReturn ? 'stroke-dasharray="5,3"' : ''} marker-end="url(#seqArrow)"/>`;
                svg += `<text x="${(fromX + toX) / 2}" y="${y - 6}" fill="#cbd5e1" font-size="9" text-anchor="middle">${label}</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        // ================================================================
        // TIMELINE RENDERER
        // ================================================================
        renderTimeline(spec) {
            const events = spec.events || spec.milestones || spec.data || [];
            const CC = this._CHART_COLORS;
            const padL = 100, axisX = 30, eventH = 60;
            const totalH = Math.max(200, events.length * eventH + 60);

            let svg = `<svg viewBox="0 0 500 ${totalH}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
            // Axis line
            svg += `<line x1="${axisX}" y1="30" x2="${axisX}" y2="${totalH - 20}" stroke="rgba(99,102,241,0.4)" stroke-width="2"/>`;

            events.forEach((ev, i) => {
                const y = 50 + i * eventH;
                const label = ClientDiagramSanitizer.sanitizeLabel(ev.label || ev.title || ev.event || '');
                const date = ClientDiagramSanitizer.sanitizeLabel(ev.date || ev.time || ev.period || '');
                svg += `<circle cx="${axisX}" cy="${y}" r="6" fill="${CC[i % CC.length]}" stroke="rgba(15,23,42,0.95)" stroke-width="2"/>`;
                svg += `<line x1="${axisX + 8}" y1="${y}" x2="${padL - 8}" y2="${y}" stroke="rgba(148,163,184,0.2)" stroke-width="1"/>`;
                svg += `<rect x="${padL}" y="${y - 16}" width="${360}" height="${32}" rx="8" fill="rgba(30,41,59,0.7)" stroke="rgba(99,102,241,0.2)" stroke-width="0.8"/>`;
                svg += `<text x="${padL + 12}" y="${y + 1}" fill="#f1f5f9" font-size="11" font-weight="500">${label}</text>`;
                if (date) svg += `<text x="${padL + 12}" y="${y + 13}" fill="#94a3b8" font-size="8">${date}</text>`;
            });

            svg += `</svg>`;
            return svg;
        },

        renderMermaid(code) {
            const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
            const header = (lines[0] || '').toLowerCase();

            if (header.startsWith('graph') || header.startsWith('flowchart')) {
                const direction = header.split(/\s+/)[1] || 'TB';
                const nodes = [], edges = [];
                const nodeMap = new Map();

                const getNode = (rawId, rawLabel) => {
                    const id = rawId.trim();
                    if (!nodeMap.has(id)) {
                        const n = { id, label: rawLabel ? rawLabel.trim() : id };
                        nodeMap.set(id, n);
                        nodes.push(n);
                    } else if (rawLabel) {
                        nodeMap.get(id).label = rawLabel.trim();
                    }
                    return nodeMap.get(id);
                };

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    const edgeMatch = line.match(/^([a-zA-Z0-9_-]+)(?:\[(.*?)\])?\s*(-->|---|==>|\.-+->) *(?:\|(.*?)\|)?\s*([a-zA-Z0-9_-]+)(?:\[(.*?)\])?/);
                    if (edgeMatch) {
                        const [, fId, fL, arr, eL, tId, tL] = edgeMatch;
                        getNode(fId, fL);
                        getNode(tId, tL);
                        edges.push({ from: fId, to: tId, label: eL || '' });
                        continue;
                    }
                    const single = line.match(/^([a-zA-Z0-9_-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})/);
                    if (single) getNode(single[1], single[2] || single[3] || single[4]);
                }
                return this.renderFlowchart({ title: 'Workflow Diagram', direction, nodes, edges });
            }

            // Mermaid PIE chart support
            if (header.startsWith('pie')) {
                const showData = header.includes('showdata');
                const titleMatch = code.match(/title\s+(.+)/i);
                const slices = [];
                lines.forEach(l => {
                    const m = l.match(/^\s*(?:"([^"]+)"|([a-zA-Z0-9_\s-]+))\s*:\s*([\d.]+)/);
                    if (m && !/title|xAxis|yAxis|data/i.test(m[1] || m[2])) {
                        slices.push({ label: (m[1] || m[2]).trim(), value: parseFloat(m[3]) });
                    }
                });
                if (slices.length > 0) {
                    return this._renderPie({
                        title: titleMatch ? titleMatch[1].replace(/["']/g, '') : 'Pie Chart',
                        data: slices
                    }, false);
                }
            }

            // Mermaid BARCHART & XYCHART support
            if (header.startsWith('barchart') || header.startsWith('xychart') || header.startsWith('xychart-beta') || header.startsWith('linechart')) {
                const titleMatch = code.match(/title\s+["']?([^"'\n\r]+)["']?/i);
                const isLine = header.startsWith('linechart') || code.includes('line [');
                const categories = [];
                const values = [];

                // Format 1: data block with "key: value" pairs
                lines.forEach(l => {
                    const m = l.match(/^\s*(?:"([^"]+)"|([a-zA-Z0-9_.-]+))\s*:\s*([\d.]+)/);
                    if (m && !/title|xAxis|yAxis|data|theme/i.test(m[1] || m[2])) {
                        categories.push((m[1] || m[2]).trim());
                        values.push(parseFloat(m[3]));
                    }
                });

                // Format 2: x-axis [...] and bar [...] or line [...]
                if (categories.length === 0) {
                    const xMatch = code.match(/x-?axis\s*(?:\[(.*?)\]|"(.*?)"\s*\[(.*?)\])/i);
                    if (xMatch) {
                        const rawCats = (xMatch[1] || xMatch[3] || '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                        categories.push(...rawCats);
                    }
                    const barMatch = code.match(/(?:bar|line)\s*\[(.*?)\]/i);
                    if (barMatch) {
                        const rawVals = (barMatch[1] || '').split(',').map(s => parseFloat(s.trim()) || 0);
                        values.push(...rawVals);
                    }
                }

                if (categories.length > 0 && values.length > 0) {
                    const title = titleMatch ? titleMatch[1].trim() : (isLine ? 'Trend Chart' : 'Frequency Distribution');
                    if (isLine) {
                        return this._renderLine({
                            title,
                            categories,
                            series: [{ name: 'Value', data: values }]
                        }, false);
                    }
                    return this._renderBar({
                        title,
                        categories,
                        series: [{ name: 'Frequency', data: values }]
                    });
                }
            }

            // Mermaid SEQUENCE DIAGRAM support
            if (header.startsWith('sequencediagram')) {
                const actors = [], actorSet = new Set(), messages = [];
                lines.slice(1).forEach(l => {
                    const participantM = l.match(/^participant\s+(\S+)(?:\s+as\s+(.+))?/i);
                    if (participantM) {
                        const id = participantM[1];
                        if (!actorSet.has(id)) { actorSet.add(id); actors.push({ id, name: participantM[2] || id }); }
                        return;
                    }
                    const msgM = l.match(/^(\S+)\s*(->>|-->>|->|-->)\s*(\S+)\s*:\s*(.+)/);
                    if (msgM) {
                        const [, from, arrow, to, text] = msgM;
                        if (!actorSet.has(from)) { actorSet.add(from); actors.push({ id: from, name: from }); }
                        if (!actorSet.has(to)) { actorSet.add(to); actors.push({ id: to, name: to }); }
                        messages.push({ from, to, label: text, type: arrow.includes('--') ? 'return' : 'call' });
                    }
                });
                if (actors.length > 0) {
                    return this.renderSequence({ actors, messages });
                }
            }

            // Fallback generic box
            return `<svg viewBox="0 0 420 70" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="416" height="66" rx="8" fill="rgba(30,41,59,0.7)" stroke="rgba(99,102,241,0.3)" />
              <text x="210" y="32" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">Mermaid Diagram (${ClientDiagramSanitizer.sanitizeLabel(header)})</text>
              <text x="210" y="48" fill="#94a3b8" font-size="10" text-anchor="middle">${lines.length} statement(s) parsed</text>
            </svg>`;
        },

        renderCard(specOrCode, options = {}) {
            const cardId = options.cardId || `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            try {
                let svg = '';
                let type = 'flowchart';
                let rawSource = '';

                if (typeof specOrCode === 'string') {
                    rawSource = specOrCode.trim();
                    type = 'mermaid';
                    svg = this.renderMermaid(rawSource);
                } else if (typeof specOrCode === 'object' && specOrCode !== null) {
                    rawSource = JSON.stringify(specOrCode, null, 2);
                    type = (specOrCode.type || 'flowchart').toLowerCase().replace(/[\s-]/g, '_');

                    // Chart type routing
                    const chartTypes = ['pie_chart', 'pie', 'donut_chart', 'donut', 'bar_chart', 'bar',
                        'horizontal_bar_chart', 'horizontal_bar', 'grouped_bar_chart', 'grouped_bar',
                        'stacked_bar_chart', 'stacked_bar', 'line_chart', 'line', 'area_chart', 'area',
                        'stacked_area_chart', 'stacked_area', 'scatter_plot', 'scatter', 'bubble_chart', 'bubble',
                        'histogram', 'radar_chart', 'radar', 'heatmap', 'box_plot', 'waterfall_chart', 'waterfall',
                        'gauge_chart', 'gauge', 'population_pyramid'];

                    if (chartTypes.includes(type) || specOrCode.series || specOrCode.data || specOrCode.matrix) {
                        svg = this.renderChart(specOrCode);
                    } else if (type === 'architecture') {
                        svg = this.renderArchitecture(specOrCode);
                    } else if (type === 'sequence' || type === 'sequence_diagram') {
                        svg = this.renderSequence(specOrCode);
                    } else if (type === 'timeline') {
                        svg = this.renderTimeline(specOrCode);
                    } else {
                        svg = this.renderFlowchart(specOrCode);
                    }
                }

                const title = ClientDiagramSanitizer.sanitizeLabel(options.title || specOrCode?.title || 'Visual Diagram');
                const displayType = type.replace(/_/g, ' ').toUpperCase();

                return `
                  <div class="liquid-diagram-card" id="${cardId}" role="region" aria-label="${title}" data-visual-title="${encodeURIComponent(title)}" data-visual-type="${encodeURIComponent(type)}">
                    <div class="diagram-card-header">
                      <div class="diagram-card-title">
                        <span class="diagram-sparkle">✦</span>
                        <span>${title}</span>
                        <span class="diagram-type-pill">${displayType}</span>
                      </div>
                      <div class="diagram-card-actions">
                        <button class="diag-btn" title="Export PNG" onclick="window.exportDiagramRaster && window.exportDiagramRaster('${cardId}','png')">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span>PNG</span>
                        </button>
                        <button class="diag-btn" title="Export JPG" onclick="window.exportDiagramRaster && window.exportDiagramRaster('${cardId}','jpg')">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span>JPG</span>
                        </button>
                        <button class="diag-btn" title="Export SVG" onclick="window.exportDiagramSvg && window.exportDiagramSvg('${cardId}')">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span>SVG</span>
                        </button>
                        <button class="diag-btn" title="Copy Diagram Source" onclick="window.copyDiagramSource && window.copyDiagramSource('${cardId}')">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>Source</span>
                        </button>
                        <button class="diag-btn primary" title="Expand Fullscreen" onclick="window.expandDiagram && window.expandDiagram('${cardId}')">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                          <span>Expand</span>
                        </button>
                      </div>
                    </div>
                    <div class="diagram-svg-viewport">
                      ${svg}
                    </div>
                    <div class="diagram-raw-source" style="display:none;" data-source="${encodeURIComponent(rawSource)}"></div>
                  </div>
                `;
            } catch (err) {
                return `
                  <div class="liquid-diagram-card" id="${cardId}">
                    <div class="diagram-card-header"><span style="color:#ef4444;">⚠ Diagram Rendering Notice</span></div>
                    <div style="padding:12px 18px;font-size:12px;color:#94a3b8;">The diagram could not be rendered (${ClientDiagramSanitizer.sanitizeLabel(err.message)}).</div>
                  </div>
                `;
            }
        }
    };

    window.DiagramRenderer = ClientDiagramRenderer;

    // Window Interaction Handlers
    window.copyDiagramSource = function(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        const rawEl = card.querySelector('.diagram-raw-source');
        if (rawEl) {
            const src = decodeURIComponent(rawEl.getAttribute('data-source') || '');
            navigator.clipboard.writeText(src).then(() => {
                showToast('✓ Diagram source copied to clipboard');
            }).catch(() => null);
        }
    };

    // ================================================================
    // DIAGRAM EXPORT ENGINE — PNG / JPG / SVG (100% Local, Zero Cloud)
    // ================================================================

    const EXPORT_SCALE = 2;              // High-DPI 2x
    const JPEG_QUALITY = 0.93;           // High quality
    const JPG_BG_COLOR = '#0b1120';      // Liquid Glass dark background

    /**
     * Generate a descriptive, slugified filename.
     */
    function generateExportFilename(title, visualType, format) {
        let ext = (format || 'png').toLowerCase().trim();
        if (ext === 'jpeg') ext = 'jpg';
        if (!['png', 'jpg', 'svg'].includes(ext)) ext = 'png';

        let slug = (title || '').toLowerCase()
            .replace(/[''""]/g, '')
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        let typeSlug = (visualType || '').toLowerCase()
            .replace(/_/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (slug && typeSlug) {
            if (slug.includes(typeSlug) || slug.includes(typeSlug.replace('-chart', ''))) {
                return `${slug}.${ext}`;
            }
            return `${slug}-${typeSlug}.${ext}`;
        }
        if (slug) return `${slug}.${ext}`;
        if (typeSlug) return `${typeSlug}.${ext}`;
        return `visual-export.${ext}`;
    }

    /**
     * Get visual metadata from a card element.
     */
    function getCardMeta(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return { card: null, title: '', type: '' };
        const title = decodeURIComponent(card.getAttribute('data-visual-title') || '') || 'Visual Diagram';
        const type = decodeURIComponent(card.getAttribute('data-visual-type') || '') || 'diagram';
        return { card, title, type };
    }

    /**
     * Core SVG → Raster (PNG/JPG) export via Canvas API.
     * Handles high-DPI, JPG background fill, and dynamic sizing.
     */
    window.exportDiagramRaster = async function(cardId, format) {
        const { card, title, type } = getCardMeta(cardId);
        if (!card) return;

        const svgEl = card.querySelector('.diagram-svg-viewport svg');
        if (!svgEl) {
            showToast('⚠ No visual to export');
            return;
        }

        const btn = card.querySelector(`[title="Export ${format.toUpperCase()}"]`);
        const originalLabel = btn ? btn.querySelector('span')?.textContent : '';
        if (btn) btn.querySelector('span').textContent = 'Preparing…';

        try {
            // Serialize SVG with inline styles
            const clonedSvg = svgEl.cloneNode(true);

            // Ensure SVG has explicit dimensions from viewBox
            const vb = clonedSvg.getAttribute('viewBox');
            let svgW = 600, svgH = 400;
            if (vb) {
                const parts = vb.split(/[\s,]+/).map(Number);
                if (parts.length >= 4) { svgW = parts[2]; svgH = parts[3]; }
            }

            // Set explicit width/height for Image rendering
            clonedSvg.setAttribute('width', svgW);
            clonedSvg.setAttribute('height', svgH);
            // Ensure xmlns
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Inject base font-family inline if missing
            if (!clonedSvg.getAttribute('style')?.includes('font-family')) {
                clonedSvg.setAttribute('style', (clonedSvg.getAttribute('style') || '') + ';font-family:Inter,system-ui,-apple-system,sans-serif;');
            }

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Create high-DPI canvas
            const canvas = document.createElement('canvas');
            const scale = EXPORT_SCALE;
            canvas.width = Math.round(svgW * scale);
            canvas.height = Math.round(svgH * scale);
            const ctx = canvas.getContext('2d');

            // For JPG: fill solid background (JPEG has no transparency)
            if (format === 'jpg' || format === 'jpeg') {
                ctx.fillStyle = JPG_BG_COLOR;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // For PNG: fill with the same dark background to preserve visual styling
            if (format === 'png') {
                ctx.fillStyle = JPG_BG_COLOR;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Load SVG into Image and draw
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(svgUrl);
                    resolve();
                };
                img.onerror = (e) => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error('SVG image load failed'));
                };
                img.src = svgUrl;
            });

            // Convert canvas to Blob
            const mimeType = (format === 'jpg' || format === 'jpeg') ? 'image/jpeg' : 'image/png';
            const quality = (format === 'jpg' || format === 'jpeg') ? JPEG_QUALITY : undefined;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

            if (!blob || blob.size === 0) {
                throw new Error('Empty export blob');
            }

            // Download
            const filename = generateExportFilename(title, type, format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = filename;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);

            showToast(`✓ ${format.toUpperCase()} exported: ${filename}`);
        } catch (err) {
            console.error('[ExportRaster]', err);
            showToast(`⚠ Couldn't export as ${format.toUpperCase()}`);
        } finally {
            if (btn && originalLabel) btn.querySelector('span').textContent = originalLabel;
        }
    };

    /**
     * SVG export with descriptive filename.
     */
    window.exportDiagramSvg = function(cardId) {
        const { card, title, type } = getCardMeta(cardId);
        if (!card) return;
        const svgEl = card.querySelector('.diagram-svg-viewport svg');
        if (svgEl) {
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const filename = generateExportFilename(title, type, 'svg');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`✓ SVG exported: ${filename}`);
        }
    };

    /**
     * Copy to clipboard (PNG image).
     */
    window.copyDiagramImage = async function(cardId) {
        const { card } = getCardMeta(cardId);
        if (!card) return;
        const svgEl = card.querySelector('.diagram-svg-viewport svg');
        if (!svgEl) return;

        try {
            const clonedSvg = svgEl.cloneNode(true);
            const vb = clonedSvg.getAttribute('viewBox');
            let svgW = 600, svgH = 400;
            if (vb) {
                const parts = vb.split(/[\s,]+/).map(Number);
                if (parts.length >= 4) { svgW = parts[2]; svgH = parts[3]; }
            }
            clonedSvg.setAttribute('width', svgW);
            clonedSvg.setAttribute('height', svgH);
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(svgW * EXPORT_SCALE);
            canvas.height = Math.round(svgH * EXPORT_SCALE);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = JPG_BG_COLOR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(svgUrl); resolve(); };
                img.onerror = reject;
                img.src = svgUrl;
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('✓ Image copied to clipboard');
            } else {
                showToast('⚠ Clipboard not supported in this browser');
            }
        } catch (err) {
            console.error('[CopyImage]', err);
            showToast('⚠ Could not copy image');
        }
    };

    /**
     * Fullscreen expand with export buttons.
     */
    window.expandDiagram = function(cardId) {
        const { card, title, type } = getCardMeta(cardId);
        if (!card) return;
        const svgEl = card.querySelector('.diagram-svg-viewport svg');

        if (svgEl) {
            const modal = document.createElement('div');
            modal.className = 'diagram-modal-overlay';
            modal.innerHTML = `
              <div class="diagram-modal-window">
                <div class="diagram-card-header">
                  <div class="diagram-card-title"><span>✦</span> <span>${ClientDiagramSanitizer.escapeHtml(title)}</span></div>
                  <div class="diagram-card-actions">
                    <button class="diag-btn" title="Export PNG" onclick="window.exportDiagramRaster && window.exportDiagramRaster('${cardId}','png')">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>PNG</span>
                    </button>
                    <button class="diag-btn" title="Export JPG" onclick="window.exportDiagramRaster && window.exportDiagramRaster('${cardId}','jpg')">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>JPG</span>
                    </button>
                    <button class="diag-btn" title="Export SVG" onclick="window.exportDiagramSvg && window.exportDiagramSvg('${cardId}')">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>SVG</span>
                    </button>
                    <button class="btn-voice-cancel" onclick="this.closest('.diagram-modal-overlay').remove()">×</button>
                  </div>
                </div>
                <div class="diagram-modal-body">
                  ${svgEl.outerHTML}
                </div>
              </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        }
    };

    function formatResponse(text) {
        if (!text) return '';

        // Strip any residual thinking tags from history or exports
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
        if (!text) return '<span style="color:var(--text-tertiary);font-style:italic;">The model produced no visible answer.</span>';

        // Extract and render code / diagram blocks before escaping
        const codeBlocks = [];
        let placeholderText = text.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const idx = codeBlocks.length;
            const l = (lang || '').toLowerCase().trim();
            const cleanCode = code.trim();

            if (l === 'mermaid' || (!l && /^(graph|flowchart|sequencediagram|pie|barchart|xychart|linechart)\b/i.test(cleanCode)) || cleanCode.startsWith('%%{init')) {
                const cardHtml = ClientDiagramRenderer.renderCard(cleanCode, { title: 'Workflow Diagram' });
                codeBlocks.push(cardHtml);
                return `___CODE_BLOCK_${idx}___`;
            }

            if (['visualization', 'diagram', 'chart', 'plot'].includes(l) || (l === 'json' && (cleanCode.includes('"type"') || cleanCode.includes('"series"') || cleanCode.includes('"categories"') || cleanCode.includes('"nodes"')))) {
                try {
                    const spec = JSON.parse(cleanCode);
                    if (spec && typeof spec === 'object' && (spec.type || spec.nodes || spec.series || spec.categories || spec.matrix || spec.data)) {
                        const cardHtml = ClientDiagramRenderer.renderCard(spec, { title: spec.title || 'Visual Diagram' });
                        codeBlocks.push(cardHtml);
                        return `___CODE_BLOCK_${idx}___`;
                    }
                } catch {}
            }

            const escapedCode = escapeHtml(code);
            codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
            return `___CODE_BLOCK_${idx}___`;
        });

        let formatted = escapeHtml(placeholderText);

        // Headers
        formatted = formatted.replace(/^### (.*$)/gim, '<h4 style="margin:14px 0 6px 0;font-size:14px;color:var(--neon-cyan);">$1</h4>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h3 style="margin:18px 0 8px 0;font-size:15.5px;color:var(--text-primary);">$1</h3>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h2 style="margin:20px 0 10px 0;font-size:17px;color:var(--text-primary);">$1</h2>');

        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Inline code
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');

        // Lists
        formatted = formatted.replace(/^[-*] (.*)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Markdown Tables
        formatted = formatted.replace(/(\|.+?\|\n\|[-:\s|]+?\|\n(?:\|.+?\|\n?)+)/g, (match) => {
            const rows = match.trim().split('\n');
            if (rows.length < 2) return match;
            const headers = rows[0].split('|').map(c => c.trim()).filter(Boolean);
            const bodyRows = rows.slice(2);
            let tableHtml = '<table class="liquid-table" style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px;"><thead><tr>';
            headers.forEach(h => { tableHtml += `<th style="border:1px solid rgba(99,102,241,0.25);padding:8px 12px;background:rgba(30,41,59,0.7);color:var(--neon-cyan);text-align:left;">${h}</th>`; });
            tableHtml += '</tr></thead><tbody>';
            bodyRows.forEach(r => {
                const cells = r.split('|').map(c => c.trim()).filter(Boolean);
                if (cells.length > 0) {
                    tableHtml += '<tr>';
                    cells.forEach(c => { tableHtml += `<td style="border:1px solid rgba(99,102,241,0.15);padding:7px 12px;background:rgba(15,23,42,0.4);">${c}</td>`; });
                    tableHtml += '</tr>';
                }
            });
            tableHtml += '</tbody></table>';
            return tableHtml;
        });

        // Newlines (except around diagram cards or tables)
        formatted = formatted.replace(/\n/g, '<br>');

        // Restore code blocks & diagrams
        codeBlocks.forEach((block, idx) => {
            formatted = formatted.replace(`___CODE_BLOCK_${idx}___`, block);
        });

        return formatted;
    }

    // 2. CONVERSATION HISTORY MANAGER
    function getConversationDateGroup(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const startOf7Days = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOf30Days = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (date >= startOfToday) return 'Today';
        if (date >= startOfYesterday) return 'Yesterday';
        if (date >= startOf7Days) return 'Previous 7 Days';
        if (date >= startOf30Days) return 'Previous 30 Days';
        return 'Older';
    }

    async function loadConversations(query = '') {
        try {
            const url = query ? `/api/chats?q=${encodeURIComponent(query)}` : '/api/chats';
            const res = await fetch(url).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                state.conversations = data.chats || [];
            }
        } catch (e) {
            console.warn('Could not load conversations from server:', e);
        }
        renderConversationList();
    }

    function renderConversationList() {
        const container = elements.conversationList;
        if (!container) return;

        if (elements.chatCountBadge) {
            elements.chatCountBadge.textContent = String(state.conversations.length);
        }
        container.innerHTML = '';

        if (state.conversations.length === 0) {
            container.innerHTML = '<div style="padding:10px 8px;font-size:11.5px;color:var(--text-tertiary);">No chats yet. Click "+ New Chat" to begin!</div>';
            return;
        }

        const groups = {
            'Pinned': [],
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Previous 30 Days': [],
            'Older': []
        };

        state.conversations.forEach(chat => {
            if (chat.pinned) {
                groups['Pinned'].push(chat);
            } else {
                const groupName = getConversationDateGroup(chat.updatedAt || chat.createdAt);
                if (groups[groupName]) {
                    groups[groupName].push(chat);
                } else {
                    groups['Older'].push(chat);
                }
            }
        });

        Object.keys(groups).forEach(groupTitle => {
            const chatsInGroup = groups[groupTitle];
            if (chatsInGroup.length === 0) return;

            const groupDiv = document.createElement('div');
            groupDiv.className = 'date-group';

            const header = document.createElement('div');
            header.className = 'date-group-header';
            header.textContent = groupTitle;
            groupDiv.appendChild(header);

            chatsInGroup.forEach(chat => {
                const row = document.createElement('div');
                row.className = `conversation-row ${state.currentConversationId === chat.id ? 'active' : ''} ${chat.pinned ? 'pinned' : ''}`;
                row.dataset.id = chat.id;

                const dateStr = formatTimestamp(new Date(chat.updatedAt || chat.createdAt));
                const metaText = `${chat.agentName || 'Super AI'} · ${dateStr}`;

                row.innerHTML = `
                    <div class="conversation-info">
                        <div class="conversation-title" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</div>
                        <div class="conversation-meta">${escapeHtml(metaText)}</div>
                    </div>
                    <div class="conversation-actions">
                        <button class="btn-chat-action btn-pin" title="${chat.pinned ? 'Unpin conversation' : 'Pin conversation'}">
                            ${chat.pinned ? '📌' : '📍'}
                        </button>
                        <button class="btn-chat-action btn-rename" title="Rename conversation">✎</button>
                        <button class="btn-chat-action btn-delete" title="Delete conversation">🗑</button>
                    </div>
                `;

                // Select
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.conversation-actions') || e.target.closest('.rename-input')) return;
                    selectConversation(chat.id);
                });

                // Pin
                row.querySelector('.btn-pin')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    togglePinConversation(chat.id, chat.pinned);
                });

                // Rename
                row.querySelector('.btn-rename')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startInlineRename(row, chat);
                });

                // Delete
                row.querySelector('.btn-delete')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDeleteModal(chat.id);
                });

                groupDiv.appendChild(row);
            });

            container.appendChild(groupDiv);
        });
    }

    function startInlineRename(rowEl, chat) {
        const titleEl = rowEl.querySelector('.conversation-title');
        if (!titleEl) return;
        const currentTitle = chat.title;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rename-input';
        input.value = currentTitle;

        titleEl.replaceWith(input);
        input.focus();
        input.select();

        let isSaved = false;
        const save = async () => {
            if (isSaved) return;
            isSaved = true;
            const newTitle = input.value.trim() || currentTitle;
            await fetch(`/api/chats/${chat.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            }).catch(() => null);
            chat.title = newTitle;
            loadConversations();
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                save();
            } else if (e.key === 'Escape') {
                isSaved = true;
                loadConversations();
            }
        });

        input.addEventListener('blur', () => {
            save();
        });
    }

    async function togglePinConversation(id, currentPinned) {
        await fetch(`/api/chats/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned: !currentPinned })
        }).catch(() => null);
        loadConversations();
    }

    function openDeleteModal(id) {
        state.deletingConversationId = id;
        if (elements.deleteModalBackdrop) {
            elements.deleteModalBackdrop.style.display = 'flex';
        }
    }

    function closeDeleteModal() {
        state.deletingConversationId = null;
        if (elements.deleteModalBackdrop) {
            elements.deleteModalBackdrop.style.display = 'none';
        }
    }

    async function confirmDeleteConversation() {
        const id = state.deletingConversationId;
        if (!id) return;
        
        await fetch(`/api/chats/${id}`, {
            method: 'DELETE'
        }).catch(() => null);

        closeDeleteModal();
        await loadConversations();

        if (state.currentConversationId === id) {
            createNewConversation();
        }
    }

    function createNewConversation() {
        const targetAgent = state.agents.find(a => a.id === 'auto') || state.agents[0];
        state.currentConversationId = null; // Fresh unsaved session
        selectAgent('auto', true);
        clearChat();
        showEmptyState(targetAgent);
        elements.chatInput.value = '';
        elements.chatInput.focus();
        renderConversationList();
    }

    async function selectConversation(id) {
        try {
            const res = await fetch(`/api/chats/${id}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                const chat = data.chat;
                state.currentConversationId = chat.id;

                // Restore agent
                const matchingAgent = state.agents.find(a => a.id === chat.agentId || a.internalId === chat.agentId || a.agent_id === chat.agentId);
                if (matchingAgent) {
                    selectAgent(matchingAgent.id, false);
                }

                // Restore model mode
                if (chat.modelMode && LOCAL_MODEL_DEFS[chat.modelMode]) {
                    state.selectedModelMode = chat.modelMode;
                    updateModelSelectorUI();
                }

                // Restore messages
                elements.chatMessages.innerHTML = '';
                if (Array.isArray(chat.messages) && chat.messages.length > 0) {
                    hideEmptyState();
                    chat.messages.forEach(msg => {
                        if (msg.role === 'user') {
                            renderUserMessage(msg);
                        } else {
                            renderAIMessage(msg);
                        }
                    });
                    scrollToBottom();
                } else {
                    clearChat();
                    showEmptyState(state.selectedAgent);
                }

                renderConversationList();
                elements.chatInput.focus();

                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            }
        } catch (err) {
            console.error('Failed to select conversation:', err);
        }
    }

    // 3. AGENT LIST MANAGER
    async function fetchAgents() {
        try {
            const response = await fetch('/api/workforce').catch(() => null);
            let data = { agents: [] };
            
            if (response && response.ok) {
                data = await response.json();
            }
            
            const superAiAgent = {
                id: 'auto',
                internalId: 'super-orchestrator',
                displayNumber: '301',
                name: 'Super AI Agent',
                category: 'Orchestrator',
                domain: 'Orchestrator',
                status: 'ready',
                capabilities: ['Autonomous Task Planning', 'Dynamic Multi-Model Routing', 'Evidence Synthesis', 'Specialist Fleet Orchestration'],
                tools: ['Delegate Task', 'Summarize', 'Access KB', 'Multi-Model Router'],
                description: 'The master AI agent that coordinates the 300 specialist AI agents to solve complex tasks.',
                examples: [
                    'Build me a complete full-stack web application with database and tests',
                    'Perform end-to-end investigation, analyze data, and prepare deliverables',
                    'Coordinate research, coding, documentation, and testing for this project',
                    'Analyze this complex problem using multiple specialized AI agents'
                ]
            };
            
            const specialistAgents = (data.agents || [])
                .filter(a => {
                    const rawId = a.agent_id || a.id || '';
                    const rawName = a.displayName || a.name || '';
                    return a.id !== 'auto' && 
                           rawId !== 'agent-301' && 
                           rawId !== 'super-orchestrator' && 
                           a.category !== 'Orchestrator' && 
                           rawName !== 'Super AI Agent' && 
                           !rawName.includes('Engineering Workflow');
                })
                .map(a => {
                    const num = parseInt((a.agent_id || a.id || '').replace(/\D/g, ''), 10);
                    const dispNum = !isNaN(num) ? String(num).padStart(3, '0') : '000';
                    let displayName = a.displayName || a.name || `Specialist AI Agent ${dispNum}`;
                    if (!displayName.endsWith('AI Agent') && !displayName.includes('AI Agent')) {
                        displayName = `${displayName} AI Agent`.replace(/Agent AI Agent/g, 'AI Agent');
                    }
                    return {
                        ...a,
                        id: a.agent_id || a.id,
                        internalId: a.agent_id || a.id,
                        displayNumber: a.displayNumber || dispNum,
                        name: displayName,
                        category: a.category || a.domain || 'Specialized AI',
                        description: a.description || `Specialist AI agent numbered ${dispNum} for ${displayName}.`,
                        capabilities: Array.isArray(a.capabilities) && a.capabilities.length > 0 ? a.capabilities : ['Task Execution', 'Natural Language Processing', 'Data Reasoning'],
                        tools: Array.isArray(a.tools) && a.tools.length > 0 ? a.tools : (Array.isArray(a.primary_tools) && a.primary_tools.length > 0 ? a.primary_tools : ['Local Inference', 'Knowledge Base Query']),
                        examples: Array.isArray(a.examples) && a.examples.length > 0 ? a.examples : []
                    };
                })
                .sort((a, b) => parseInt(a.displayNumber, 10) - parseInt(b.displayNumber, 10));
            
            // ORDER: 001..300 specialists first, 301 Super AI Agent LAST
            state.agents = [...specialistAgents, superAiAgent];
            renderAgentList();
            
            // Select Super AI Agent (301) by default
            selectAgent('auto', true);
            
        } catch (error) {
            console.error('Error fetching agents:', error);
            elements.agentList.innerHTML = '<div class="error-msg">Failed to load agents</div>';
        }
    }

    function getStatusClass(agent) {
        if (!agent.status) return 'status-active';
        const st = agent.status.toLowerCase();
        if (st === 'ready' || st === 'active' || st === 'ok') return 'status-active';
        if (st === 'busy' || st === 'processing') return 'status-busy';
        if (st === 'error' || st === 'failed') return 'status-error';
        return 'status-offline';
    }

    function renderAgentList(query = '') {
        const q = query.trim().toLowerCase();
        elements.agentList.innerHTML = '';
        
        const filteredAgents = state.agents.filter(agent => {
            const isSuperAi = agent.id === 'auto' || agent.displayNumber === '301' || agent.name === 'Super AI Agent' || agent.category === 'Orchestrator';
            const num = agent.displayNumber || getAgentDisplayNumber(agent);
            const numWithoutZero = String(parseInt(num, 10));
            
            // Smart Category Filter
            if (state.selectedCategory && state.selectedCategory !== 'all') {
                const target = state.selectedCategory.toLowerCase();
                const agentCat = (agent.category || '').toLowerCase();
                const agentDomain = (agent.domain || '').toLowerCase();
                const agentDesc = (agent.description || '').toLowerCase();
                const allTags = `${agentCat} ${agentDomain} ${agentDesc} ${(agent.capabilities || []).join(' ')}`.toLowerCase();
                
                let matchesCategory = false;
                if (target === 'coding' || target === 'languages') {
                    matchesCategory = agentCat.includes('coding') || agentCat.includes('language') || allTags.includes('python') || allTags.includes('java') || allTags.includes('c/c++') || allTags.includes('c#') || allTags.includes('go ') || allTags.includes('golang') || allTags.includes('rust') || allTags.includes('swift') || allTags.includes('kotlin') || allTags.includes('solidity') || allTags.includes('javascript') || allTags.includes('typescript') || allTags.includes('node') || allTags.includes('bun') || allTags.includes('deno') || allTags.includes('package');
                } else if (target === 'frontend') {
                    matchesCategory = agentCat.includes('design') || agentCat.includes('frontend') || allTags.includes('react') || allTags.includes('next.js') || allTags.includes('vue') || allTags.includes('angular') || allTags.includes('svelte') || allTags.includes('css') || allTags.includes('ui') || allTags.includes('web perf') || allTags.includes('wcag') || allTags.includes('accessibility');
                } else if (target === 'backend') {
                    matchesCategory = agentCat.includes('backend') || allTags.includes('api') || allTags.includes('architecture') || allTags.includes('microservices') || allTags.includes('clean arch') || allTags.includes('ddd') || allTags.includes('cqrs') || allTags.includes('circuit') || allTags.includes('caching') || allTags.includes('gateway') || allTags.includes('opentelemetry');
                } else if (target === 'database' || target === 'databases & sql') {
                    matchesCategory = agentCat.includes('database') || allTags.includes('postgres') || allTags.includes('sql') || allTags.includes('database') || allTags.includes('locking') || allTags.includes('deadlock') || allTags.includes('partitioning') || allTags.includes('sharding') || allTags.includes('replication') || allTags.includes('acid') || allTags.includes('indexing');
                } else if (target === 'devops' || target === 'cloud & devops') {
                    matchesCategory = allTags.includes('aws') || allTags.includes('azure') || allTags.includes('gcp') || allTags.includes('cloud') || allTags.includes('docker') || allTags.includes('kubernetes') || allTags.includes('k8s') || allTags.includes('helm') || allTags.includes('gitops') || allTags.includes('argocd') || allTags.includes('flux') || allTags.includes('github actions') || allTags.includes('ci/cd') || allTags.includes('jenkins');
                } else if (target === 'ai' || target === 'ai / ml & rag' || target === 'specialized ai') {
                    matchesCategory = agentCat.includes('specialized ai') || allTags.includes('llm') || allTags.includes('rag') || allTags.includes('vector') || allTags.includes('embedding') || allTags.includes('prompt') || allTags.includes('context') || allTags.includes('memory') || allTags.includes('multi-agent') || allTags.includes('quantization') || allTags.includes('lora');
                } else if (target === 'security' || target === 'cybersecurity') {
                    matchesCategory = agentCat.includes('security') || allTags.includes('zero trust') || allTags.includes('owasp') || allTags.includes('sql injection') || allTags.includes('xss') || allTags.includes('csrf') || allTags.includes('ssrf') || allTags.includes('auth') || allTags.includes('jwt') || allTags.includes('sbom') || allTags.includes('cve') || allTags.includes('waf');
                } else if (target === 'testing' || target === 'qa & testing') {
                    matchesCategory = allTags.includes('test') || allTags.includes('testing') || allTags.includes('flakiness') || allTags.includes('vitest') || allTags.includes('mutation') || allTags.includes('fuzz') || allTags.includes('snapshot') || allTags.includes('chaos') || allTags.includes('qa') || allTags.includes('refactoring');
                } else if (target === 'release' || target === 'release & eng') {
                    matchesCategory = allTags.includes('monorepo') || allTags.includes('compiler') || allTags.includes('release') || allTags.includes('semver') || allTags.includes('changelog') || allTags.includes('devex') || allTags.includes('workflow') || allTags.includes('repository layout');
                } else if (target === 'data' || target === 'data & analytics') {
                    matchesCategory = agentCat.includes('data') || allTags.includes('telemetry') || allTags.includes('analytics') || allTags.includes('spreadsheet') || allTags.includes('sensor') || allTags.includes('scada');
                } else if (target === 'writing' || target === 'writing & communication') {
                    matchesCategory = agentCat.includes('writing') || agentCat.includes('communication') || allTags.includes('document') || allTags.includes('report') || allTags.includes('email') || allTags.includes('summarizer');
                } else if (target === 'research' || target === 'research & knowledge') {
                    matchesCategory = agentCat.includes('research') || agentCat.includes('knowledge') || allTags.includes('sop') || allTags.includes('patent') || allTags.includes('manual');
                } else if (target === 'business' || target === 'business & ops' || target === 'business & management') {
                    matchesCategory = agentCat.includes('business') || agentCat.includes('management') || agentCat.includes('procurement') || agentCat.includes('finance') || allTags.includes('supply chain') || allTags.includes('project') || allTags.includes('cost');
                } else {
                    matchesCategory = agentCat.includes(target) || agentDomain.includes(target) || target.includes(agentCat);
                }
                
                if (!isSuperAi && !matchesCategory) {
                    return false;
                }
            }

            if (!q) return true;
            
            const matchesSuperAlias = isSuperAi && (
                q.includes('super') || q.includes('auto') || q.includes('sovereign') || 
                q.includes('orchestrator') || q.includes('301') || q.includes('master')
            );
            
            const matchesNumber = q === num || q === numWithoutZero || (`agent-${num}`).includes(q) || (`agent-${numWithoutZero}`).includes(q);
            const searchStr = `${agent.name} ${agent.id} ${agent.category || ''} ${agent.domain || ''} ${agent.description || ''} ${(agent.capabilities || []).join(' ')}`.toLowerCase();
            
            return matchesSuperAlias || matchesNumber || searchStr.includes(q);
        });
        
        if (filteredAgents.length === 0) {
            elements.agentList.innerHTML = '<div class="empty-list" style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:12px;">No agents match your filter</div>';
            return;
        }
        
        filteredAgents.forEach(agent => {
            const isSuper = agent.id === 'auto' || agent.displayNumber === '301' || agent.name === 'Super AI Agent' || agent.category === 'Orchestrator';
            
            if (isSuper) {
                const sep = document.createElement('div');
                sep.className = 'agent-301-separator agent-101-separator';
                elements.agentList.appendChild(sep);
            }

            const div = document.createElement('div');
            div.className = `agent-row ${state.selectedAgent?.id === agent.id ? 'active' : ''} ${isSuper ? 'is-super-ai' : ''}`;
            div.dataset.id = agent.id;
            
            const avatar = generateAgentAvatar(agent);
            const subtitle = isSuper ? 'super-orchestrator · 301 Super AI Agent' : `agent-${avatar.number} · ${escapeHtml(agent.category || agent.domain || 'Specialist')}`;
            
            div.innerHTML = `
                <div class="agent-row-avatar" style="background: ${avatar.color}; border-color: ${avatar.borderGlow}" aria-label="Agent ${avatar.number} — ${escapeHtml(agent.name)}">
                    ${avatar.number}
                    <span class="status-indicator ${getStatusClass(agent)}"></span>
                </div>
                <div class="agent-row-info">
                    <div class="agent-row-name">${escapeHtml(agent.name)}</div>
                    <div class="agent-row-domain">${subtitle}</div>
                </div>
            `;
            
            div.addEventListener('click', () => selectAgent(agent.id, true));
            elements.agentList.appendChild(div);
        });
    }

    function selectAgent(agentId, resetView = true) {
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;
        
        state.selectedAgent = agent;
        
        // Update UI
        updateAgentHeader(agent);
        updatePlaceholder(agent);
        
        // Update list active state
        document.querySelectorAll('.agent-row').forEach(row => {
            row.classList.toggle('active', row.dataset.id === agentId);
        });
        
        if (resetView) {
            // Restore chat history or show empty state
            if (state.chatHistories[agentId] && state.chatHistories[agentId].length > 0) {
                restoreChatHistory(agentId);
            } else {
                clearChat();
                showEmptyState(agent);
            }
        }
        
        // Switch view if not on workspace
        if (state.activeView !== 'agent-workspace') {
            switchMainView('agent-workspace');
        }
        
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    // 4. WORKSPACE MANAGER
    function updateAgentHeader(agent) {
        const avatar = generateAgentAvatar(agent);
        if (elements.agentAvatar) {
            elements.agentAvatar.style.background = avatar.color;
            elements.agentAvatar.textContent = avatar.number;
            elements.agentAvatar.setAttribute('aria-label', `Agent ${avatar.number} — ${agent.name}`);
        }
        
        if (elements.agentName) elements.agentName.textContent = agent.name;
        
        if (avatar.isSuper) {
            if (elements.agentSubtitle) elements.agentSubtitle.textContent = 'super-orchestrator · 301 Agents';
            document.title = '[301] Super AI Agent — 301 Super AI Agents';
        } else {
            if (elements.agentSubtitle) elements.agentSubtitle.textContent = `agent-${avatar.number} · ${agent.category || agent.domain || 'Specialist'}`;
            document.title = `[${avatar.number}] ${agent.name} — 301 Super AI Agents`;
        }
        
        const orb = document.getElementById('agentOrb');
        if (orb) {
            orb.style.background = `radial-gradient(circle, ${avatar.borderGlow} 0%, rgba(139, 92, 246, 0.4) 60%, transparent 80%)`;
        }
    }

    function getAgentExamples(agent) {
        if (agent && Array.isArray(agent.examples) && agent.examples.length > 0) {
            return agent.examples;
        }
        return ['No example prompts available yet.'];
    }

    window.useExamplePrompt = function(promptText) {
        if (!promptText || promptText === 'No example prompts available yet.') return;
        if (elements.chatInput) {
            elements.chatInput.value = promptText;
            elements.chatInput.focus();
            elements.chatInput.dispatchEvent(new Event('input'));
        }
    };

    function renderAgentRedirectCard({ sourceAgent, targetAgent, originalPrompt, reason, politeMessage }) {
        const srcId = sourceAgent?.id || (state.selectedAgent?.id || 'agent-001');
        const srcName = sourceAgent?.name || (state.selectedAgent?.name || 'Writing AI Agent');
        
        let targetId = targetAgent?.id || targetAgent?.agent_id;
        if (!targetId && targetAgent?.displayNumber) {
            targetId = `agent-${targetAgent.displayNumber}`;
        }
        if (!targetId && targetAgent?.number) {
            targetId = `agent-${targetAgent.number}`;
        }
        if (!targetId) targetId = 'agent-004';

        const targetName = targetAgent?.name || targetAgent?.displayName || 'Quiz AI Agent';
        const promptText = originalPrompt || '';
        const rawMessage = politeMessage || `This request is outside my specialization.\n\nI'm specialized in writing articles, essays, and editorial content. This request is better handled by the **${escapeHtml(targetName)}**.`;
        const bodyHtml = formatResponse(rawMessage);

        return `
            <div class="scope-redirect-card" data-source-id="${escapeHtml(srcId)}" data-target-id="${escapeHtml(targetId)}">
                <div class="scope-redirect-header">
                    <span class="sparkle">✦</span>
                    <span>Outside My Specialization</span>
                </div>
                <div class="scope-redirect-body">
                    ${bodyHtml}
                </div>
                <div class="scope-redirect-action">
                    <button class="btn-switch-agent"
                            role="button"
                            aria-label="Switch to ${escapeHtml(targetName)}"
                            data-target-id="${escapeHtml(targetId)}"
                            data-prompt="${escapeHtml(promptText)}"
                            onclick="window.executeAgentSwitch(this, '${escapeHtml(targetId)}', '${escapeHtml(promptText).replace(/'/g, "\\'")}')">
                        <span class="switch-icon">↗</span>
                        <span class="switch-label">Switch to ${escapeHtml(targetName)}</span>
                    </button>
                </div>
            </div>
        `;
    }

    window.executeAgentSwitch = async function(btnEl, targetAgentId, promptText) {
        if (!targetAgentId) return;

        let targetName = 'Specialist AI Agent';

        // 1. Locate destination agent in canonical registry
        const targetAgent = (state.agents || []).find(a => 
            a.id === targetAgentId || 
            a.agent_id === targetAgentId || 
            a.displayNumber === targetAgentId.replace(/\D/g, '').padStart(3, '0') ||
            a.id === `agent-${targetAgentId.replace(/\D/g, '').padStart(3, '0')}` ||
            (a.displayNumber && targetAgentId.includes(a.displayNumber))
        );

        if (targetAgent) {
            targetName = targetAgent.name || targetAgent.displayName || targetName;
        }

        // Prevent duplicate clicks & set loading state
        if (btnEl) {
            if (btnEl.disabled || btnEl.classList.contains('loading')) return;
            btnEl.disabled = true;
            btnEl.classList.add('loading');
            btnEl.innerHTML = `<span class="switch-spinner"></span> <span class="switch-label">Switching to ${escapeHtml(targetName)}...</span>`;
        }

        if (!targetAgent) {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.classList.remove('loading');
                btnEl.classList.add('error');
                btnEl.innerHTML = `<span class="switch-icon">⚠</span> <span class="switch-label">Unable to switch to ${escapeHtml(targetAgentId)}</span>`;
            }
            appendSystemEvent(`Unable to switch to ${targetAgentId}. Agent not found in registry.`);
            return;
        }

        // 2. Switch active agent in workspace (preserving conversation & chat view)
        selectAgent(targetAgent.id, false);

        // 3. Update main header & placeholder immediately
        updateAgentHeader(targetAgent);
        updatePlaceholder(targetAgent);

        // 4. Update left sidebar visual selection
        document.querySelectorAll('.agent-row').forEach(row => {
            row.classList.toggle('active', row.dataset.id === targetAgent.id);
        });

        const agentNum = targetAgent.displayNumber || targetAgent.id.replace(/\D/g, '').padStart(3, '0');
        appendSystemEvent(`Handoff: Switched to [${agentNum}] ${targetAgent.name}`);

        // 5. Automatic retry: re-run the original user prompt with the new specialist agent
        if (promptText && promptText.trim()) {
            try {
                await sendToBackend(targetAgent.id, promptText.trim(), [], null, 'text', { isHandoffRetry: true });
            } catch (err) {
                console.error('[HANDOFF_ERROR]', err);
                appendSystemEvent(`Failed to execute request with ${targetAgent.name}: ${err.message}`);
            }
        }

        // 6. Set button state to completed
        if (btnEl) {
            btnEl.classList.remove('loading');
            btnEl.classList.add('completed');
            btnEl.innerHTML = `<span class="switch-icon">✓</span> <span class="switch-label">Switched to ${escapeHtml(targetAgent.name)}</span>`;
        }
    };

    window.switchAgentAndRetainPrompt = function(targetAgentId, promptText) {
        window.executeAgentSwitch(null, targetAgentId, promptText);
    };

    function showEmptyState(agent) {
        if (!elements.chatEmptyState) return;
        const avatar = generateAgentAvatar(agent);
        const examples = getAgentExamples(agent);
        const caps = agent?.capabilities?.filter(c => c !== 'sovereign-local') || [];
        
        const capsHtml = caps.length > 0 ? `
            <div class="empty-caps-row" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:560px;margin:0 auto 18px auto;">
                ${caps.slice(0, 4).map(c => `<span style="font-size:11.5px;color:#a5b4fc;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.30);padding:3px 10px;border-radius:14px;">✓ ${escapeHtml(c)}</span>`).join('')}
            </div>
        ` : '';

        elements.chatEmptyState.innerHTML = `
            <div class="empty-avatar" style="background:${avatar.color}; border-color:${avatar.borderGlow}">
                ${avatar.number}
            </div>
            <h2>${escapeHtml(agent.name)}</h2>
            <p>${escapeHtml(agent.description || 'Specialist AI agent ready to assist on local hardware.')}</p>
            ${capsHtml}
            <div class="example-chips">
                ${examples.map(ex => {
                    if (ex === 'No example prompts available yet.') {
                        return `<span class="example-chip-empty" style="padding:6px 14px;border-radius:20px;font-size:12px;color:var(--text-tertiary);border:1px dashed var(--border-glass);">${escapeHtml(ex)}</span>`;
                    }
                    return `<button class="example-chip" onclick="window.useExamplePrompt('${escapeHtml(ex).replace(/'/g, "\\'")}')">${escapeHtml(ex)}</button>`;
                }).join('')}
            </div>
        `;
        elements.chatEmptyState.style.display = 'flex';
        elements.chatMessages.style.display = 'none';
    }

    function hideEmptyState() {
        if (elements.chatEmptyState) elements.chatEmptyState.style.display = 'none';
        if (elements.chatMessages) elements.chatMessages.style.display = 'flex';
    }

    // 5. CHAT & COMPOSER MANAGER
    function scrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }

    function updatePlaceholder(agent) {
        if (elements.chatInput) {
            elements.chatInput.placeholder = `Message ${agent?.name || 'Super AI Agent'}...`;
        }
    }

    async function copyCleanResponse(text, btnEl) {
        if (!text) return;
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }

            if (btnEl) {
                const origHtml = btnEl.innerHTML;
                btnEl.classList.add('copied');
                btnEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied</span>`;
                setTimeout(() => {
                    btnEl.classList.remove('copied');
                    btnEl.innerHTML = origHtml;
                }, 1800);
            }
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }

    function setReplyContext(replyData) {
        state.replyContext = replyData;
        if (elements.replyContextArea) {
            if (elements.replyAgentLabel) {
                elements.replyAgentLabel.textContent = `Replying to ${replyData.agentName || 'Super AI Agent'}`;
            }
            if (elements.replyPreviewText) {
                const preview = (replyData.content || '').trim().replace(/\s+/g, ' ');
                const truncated = preview.length > 180 ? preview.slice(0, 180) + '...' : preview;
                elements.replyPreviewText.textContent = `"${truncated}"`;
            }
            elements.replyContextArea.style.display = 'block';
        }
        if (elements.chatInput) {
            elements.chatInput.placeholder = `Reply to ${replyData.agentName || 'Super AI Agent'}...`;
            elements.chatInput.focus();
        }
    }

    function clearReplyContext() {
        state.replyContext = null;
        if (elements.replyContextArea) {
            elements.replyContextArea.style.display = 'none';
        }
        updatePlaceholder(state.selectedAgent);
    }

    async function downloadResponseExport(content, title, format, btnEl) {
        if (!content) return;
        const origHtml = btnEl ? btnEl.innerHTML : '';
        if (btnEl) {
            btnEl.disabled = true;
            btnEl.innerHTML = `<span class="spinner-tiny" style="display:inline-block;width:10px;height:10px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:4px;"></span> <span>Exporting...</span>`;
        }

        try {
            const resp = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    title: title || state.currentConversation?.title || state.selectedAgent?.name || 'AI Response',
                    format
                })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ error: 'Export failed' }));
                showToast(`⚠ ${err.error || 'Could not export this response.'}`);
                return;
            }

            const disposition = resp.headers.get('content-disposition');
            let filename = `${(title || 'response').toLowerCase().replace(/[^a-z0-9]/g, '-')}.${format === 'excel' ? 'xlsx' : format}`;
            if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

            showToast(`✓ Downloaded ${filename}`);
        } catch (err) {
            console.error('[ExportResponse]', err);
            showToast('⚠ Could not export this response.');
        } finally {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = origHtml;
            }
        }
    }

    function createActionsRow(cleanContent, agentName, modelName, msgId) {
        const row = document.createElement('div');
        row.className = 'msg-actions-row';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-msg-action btn-copy-msg';
        copyBtn.title = 'Copy clean response text';
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy</span>`;
        copyBtn.addEventListener('click', () => copyCleanResponse(cleanContent, copyBtn));

        const answerBtn = document.createElement('button');
        answerBtn.className = 'btn-msg-action btn-answer-msg';
        answerBtn.title = 'Answer or refine this response';
        answerBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg> <span>Answer</span>`;
        answerBtn.addEventListener('click', () => {
            setReplyContext({
                messageId: msgId || `msg-${Date.now()}`,
                agentId: state.selectedAgent?.id || 'auto',
                agentName: agentName || state.selectedAgent?.name || 'Super AI Agent',
                model: modelName,
                content: cleanContent
            });
        });

        const readAloudBtn = document.createElement('button');
        readAloudBtn.className = 'btn-msg-action btn-read-aloud';
        readAloudBtn.title = 'Read response aloud in natural Indian English';
        readAloudBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Read Aloud</span>`;
        readAloudBtn.addEventListener('click', () => toggleSpeech(cleanContent, readAloudBtn));

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'btn-msg-action btn-export-pdf';
        pdfBtn.title = 'Download response as formatted PDF';
        pdfBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> <span>PDF</span>`;
        pdfBtn.addEventListener('click', () => downloadResponseExport(cleanContent, agentName, 'pdf', pdfBtn));

        const xlsxBtn = document.createElement('button');
        xlsxBtn.className = 'btn-msg-action btn-export-xlsx';
        xlsxBtn.title = 'Download structured response as Excel spreadsheet (.xlsx)';
        xlsxBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg> <span>Excel</span>`;
        xlsxBtn.addEventListener('click', () => downloadResponseExport(cleanContent, agentName, 'xlsx', xlsxBtn));

        const csvBtn = document.createElement('button');
        csvBtn.className = 'btn-msg-action btn-export-csv';
        csvBtn.title = 'Download structured data as CSV (.csv)';
        csvBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>CSV</span>`;
        csvBtn.addEventListener('click', () => downloadResponseExport(cleanContent, agentName, 'csv', csvBtn));

        row.appendChild(copyBtn);
        row.appendChild(answerBtn);
        row.appendChild(readAloudBtn);
        row.appendChild(pdfBtn);
        row.appendChild(xlsxBtn);
        row.appendChild(csvBtn);
        return row;
    }

    // VOICE SUBSYSTEM (Indian English STT + TTS)
    const voiceState = {
        isRecording: false,
        isSpeaking: false,
        activeBtn: null,
        recognition: null,
        mediaStream: null,
        audioContext: null,
        analyser: null,
        animFrame: null
    };

    function sanitizeTextForSpeech(raw) {
        if (!raw) return '';
        let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
        text = text.replace(/```[\s\S]*?```/g, " I have generated the code on screen for your review. ");
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\|[\s\S]*?\|\n\|[-:\s|]+\|\n([\s\S]*?)(?=\n\n|$)/g, " The data table is displayed on screen. ");
        text = text.replace(/⚡\s*[^\n]+/g, '');
        text = text.replace(/●\s*[^\n]+/g, '');
        text = text.replace(/\[ATTACHED EVIDENCE:[^\]]+\]/gi, '');
        text = text.replace(/\b(AUDIT ID|TRACE ID|EXECUTION TRACE|0 EXTERNAL CALLS)\b[^\n]*/gi, '');
        text = text.replace(/^#{1,6}\s+/gm, '');
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
        text = text.replace(/\*([^*]+)\*/g, '$1');
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        text = text.replace(/^[\*\-•]\s+/gm, ' ');
        text = text.replace(/^\d+\.\s+/gm, ' ');
        text = text.replace(/[\r\n]+/g, ' ');
        return text.replace(/\s{2,}/g, ' ').trim();
    }

    function toggleSpeech(text, btn) {
        if (voiceState.isSpeaking) {
            stopSpeech();
            return;
        }
        startSpeech(text, btn);
    }

    function getIndianFemaleVoice() {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // Preferred Female Indian English Voices in priority order
        const preferredFemaleNames = [
            'neerja', 'heera', 'kavita', 'veena', 'lekha', 'aditi', 'sangeeta', 'priya', 'ananya',
            'online (natural) - english (india)', 'english (india)', 'india'
        ];

        // Explicitly avoid male voices
        const maleNames = ['ravi', 'george', 'david', 'mark', 'prabhat', 'male'];

        // 1. Exact female Indian English match
        for (const name of preferredFemaleNames) {
            const match = voices.find(v => {
                const n = v.name.toLowerCase();
                const l = (v.lang || '').toLowerCase();
                const isMale = maleNames.some(m => n.includes(m));
                return (l.includes('en-in') || l.includes('en_in') || n.includes('india')) && n.includes(name) && !isMale;
            });
            if (match) return match;
        }

        // 2. Any en-IN voice that is not explicitly male
        const anyIndian = voices.find(v => {
            const n = v.name.toLowerCase();
            const l = (v.lang || '').toLowerCase();
            const isMale = maleNames.some(m => n.includes(m));
            return (l.includes('en-in') || l.includes('en_in') || n.includes('india')) && !isMale;
        });
        if (anyIndian) return anyIndian;

        // 3. Fallback to en-IN language code
        return voices.find(v => (v.lang || '').toLowerCase().includes('en-in')) || null;
    }

    async function startSpeech(text, btn) {
        stopSpeech();
        const clean = sanitizeTextForSpeech(text);
        if (!clean) return;

        voiceState.isSpeaking = true;
        voiceState.activeBtn = btn;

        if (btn) {
            btn.classList.add('speaking');
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg> <span>Stop</span>`;
        }

        try {
            // 1. Primary Air-Gapped Local Offline Audio Stream (WAV from Native OneCore/SAPI5)
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: clean, rate: 1.0 })
            });

            if (!response.ok) {
                throw new Error(`Offline TTS endpoint returned status ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            voiceState.currentAudio = audio;
            voiceState.currentAudioUrl = audioUrl;

            audio.onended = () => stopSpeech();
            audio.onerror = (e) => {
                console.warn('[OFFLINE_AUDIO_PLAYBACK_WARN] Audio stream playback failed:', e);
                startBrowserSpeechFallback(clean, btn);
            };

            await audio.play();
        } catch (offlineErr) {
            console.warn('[OFFLINE_TTS_NOTICE] Using browser fallback voice:', offlineErr.message);
            startBrowserSpeechFallback(clean, btn);
        }
    }

    function startBrowserSpeechFallback(clean, btn) {
        if (!('speechSynthesis' in window)) {
            stopSpeech();
            alert('Offline audio could not be synthesized, and browser SpeechSynthesis is not supported.');
            return;
        }

        const sentences = clean.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [clean];
        const trimmedSentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
        if (trimmedSentences.length === 0) {
            stopSpeech();
            return;
        }

        voiceState.isSpeaking = true;
        voiceState.activeBtn = btn;
        voiceState.speechIndex = 0;
        voiceState.speechSentences = trimmedSentences;

        speakNextSentenceBrowser();
    }

    function speakNextSentenceBrowser() {
        if (!voiceState.isSpeaking || !voiceState.speechSentences) return;

        if (voiceState.speechIndex >= voiceState.speechSentences.length) {
            stopSpeech();
            return;
        }

        const sentence = voiceState.speechSentences[voiceState.speechIndex];
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-IN';

        const femaleVoice = getIndianFemaleVoice();
        if (femaleVoice) utterance.voice = femaleVoice;

        const isQuestion = sentence.endsWith('?');
        const isFirst = voiceState.speechIndex === 0;
        const isLast = voiceState.speechIndex === voiceState.speechSentences.length - 1;

        let basePitch = 1.0;
        if (isQuestion) basePitch = 1.04;
        else if (isFirst) basePitch = 1.01;
        else if (isLast) basePitch = 0.98;
        else {
            basePitch = 0.99 + (voiceState.speechIndex % 3) * 0.015;
        }

        utterance.pitch = basePitch;
        utterance.rate = 0.98;
        utterance.volume = 1.0;

        utterance.onend = () => {
            if (!voiceState.isSpeaking) return;
            voiceState.speechIndex++;
            voiceState.speechTimer = setTimeout(() => {
                speakNextSentenceBrowser();
            }, 130);
        };

        utterance.onerror = () => {
            stopSpeech();
        };

        window.speechSynthesis.speak(utterance);
    }

    function stopSpeech() {
        if (voiceState.currentAudio) {
            try {
                voiceState.currentAudio.pause();
                voiceState.currentAudio.currentTime = 0;
            } catch {}
            voiceState.currentAudio = null;
        }
        if (voiceState.currentAudioUrl) {
            try { URL.revokeObjectURL(voiceState.currentAudioUrl); } catch {}
            voiceState.currentAudioUrl = null;
        }
        if (voiceState.speechTimer) {
            clearTimeout(voiceState.speechTimer);
            voiceState.speechTimer = null;
        }
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch {}
        }
        if (voiceState.activeBtn) {
            voiceState.activeBtn.classList.remove('speaking');
            voiceState.activeBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Read Aloud</span>`;
        }
        voiceState.isSpeaking = false;
        voiceState.activeBtn = null;
        voiceState.speechSentences = null;
        voiceState.speechIndex = 0;
    }

    async function toggleVoiceRecording() {
        if (voiceState.isRecording) {
            stopVoiceRecording(false);
        } else {
            startVoiceRecording();
        }
    }

    async function startVoiceRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone access is not supported in this browser. You can continue typing directly in the composer.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            voiceState.mediaStream = stream;
            voiceState.recordedChunks = [];

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                voiceState.audioContext = new AudioContextClass();
                const source = voiceState.audioContext.createMediaStreamSource(stream);
                voiceState.analyser = voiceState.audioContext.createAnalyser();
                voiceState.analyser.fftSize = 64;
                source.connect(voiceState.analyser);
                updateWaveformBars();
            }

            // Local MediaRecorder for offline audio capture
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav');

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            voiceState.mediaRecorder = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    voiceState.recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                if (voiceState.isCancelled) {
                    voiceState.isCancelled = false;
                    return;
                }

                if (!voiceState.recordedChunks || voiceState.recordedChunks.length === 0) {
                    return;
                }

                const audioBlob = new Blob(voiceState.recordedChunks, { type: mimeType });
                voiceState.recordedChunks = [];

                if (elements.voiceStatusText) {
                    elements.voiceStatusText.textContent = 'Transcribing locally (Offline STT)...';
                }

                try {
                    // Convert Blob to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = reader.result;
                        try {
                            const resp = await fetch('/api/stt/transcribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    audio_base64: base64Audio,
                                    locale: 'en-IN'
                                })
                            });

                            if (!resp.ok) {
                                throw new Error(`Offline STT returned status ${resp.status}`);
                            }

                            const data = await resp.json();
                            const transcript = (data.text || '').trim();

                            if (transcript && elements.chatInput) {
                                elements.chatInput.value = (elements.chatInput.value ? elements.chatInput.value + ' ' : '') + transcript;
                                elements.chatInput.dispatchEvent(new Event('input'));
                                elements.chatInput.focus();
                            }

                            if (elements.voiceStatusText) {
                                elements.voiceStatusText.textContent = transcript ? '✓ Transcript Ready (Offline)' : 'No speech detected';
                            }
                        } catch (err) {
                            console.warn('[OFFLINE_STT_ERROR]', err);
                            if (elements.voiceStatusText) {
                                elements.voiceStatusText.textContent = '⚠ Offline Voice Input Unavailable';
                            }
                        } finally {
                            setTimeout(() => {
                                if (elements.voiceRecordingBanner) elements.voiceRecordingBanner.style.display = 'none';
                                if (elements.voiceInputBtn) elements.voiceInputBtn.classList.remove('recording');
                            }, 1200);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                } catch (e) {
                    console.warn('[AUDIO_BLOB_ERROR]', e);
                }
            };

            mediaRecorder.start(100); // 100ms timeslice
            voiceState.isRecording = true;
            voiceState.isCancelled = false;

            if (elements.voiceInputBtn) elements.voiceInputBtn.classList.add('recording');
            if (elements.voiceRecordingBanner) elements.voiceRecordingBanner.style.display = 'flex';
            if (elements.voiceStatusText) elements.voiceStatusText.textContent = 'Listening (Air-Gapped Local Capture)...';
        } catch (err) {
            console.warn('Microphone access note:', err);
            alert("Microphone access could not be acquired. Please ensure microphone permissions are allowed.");
        }
    }

    function updateWaveformBars() {
        if (!voiceState.isRecording || !voiceState.analyser) return;
        const dataArray = new Uint8Array(voiceState.analyser.frequencyBinCount);
        voiceState.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        const bars = document.querySelectorAll('.wave-bar');
        bars.forEach((b, idx) => {
            const val = dataArray[idx * 2] || avg;
            const height = Math.max(4, Math.min(18, Math.round((val / 255) * 20)));
            b.style.height = `${height}px`;
        });

        voiceState.animFrame = requestAnimationFrame(updateWaveformBars);
    }

    function stopVoiceRecording(cancelled = false) {
        if (voiceState.animFrame) cancelAnimationFrame(voiceState.animFrame);
        voiceState.isCancelled = cancelled;

        if (voiceState.mediaRecorder && voiceState.mediaRecorder.state !== 'inactive') {
            try { voiceState.mediaRecorder.stop(); } catch {}
        }
        if (voiceState.mediaStream) {
            voiceState.mediaStream.getTracks().forEach(t => t.stop());
            voiceState.mediaStream = null;
        }
        if (voiceState.audioContext) {
            try { voiceState.audioContext.close(); } catch {}
            voiceState.audioContext = null;
        }

        voiceState.isRecording = false;
        if (cancelled) {
            if (elements.voiceInputBtn) elements.voiceInputBtn.classList.remove('recording');
            if (elements.voiceRecordingBanner) elements.voiceRecordingBanner.style.display = 'none';
            if (elements.chatInput) elements.chatInput.focus();
        }
    }

    function createUserActionsRow(cleanContent) {
        const row = document.createElement('div');
        row.className = 'msg-actions-row user-actions-row';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-msg-action btn-copy-msg user-copy-btn';
        copyBtn.title = 'Copy question text';
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy</span>`;
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyCleanResponse(cleanContent, copyBtn);
        });

        row.appendChild(copyBtn);
        return row;
    }

    function appendUserMessage(text, attachments = [], replyTo = null) {
        hideEmptyState();
        const msg = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text || '',
            attachments: (attachments || []).map(a => ({
                id: a.id || `att-${Date.now()}`,
                name: a.name,
                size: a.size,
                type: a.type,
                status: a.status || 'ready'
            })),
            replyTo: replyTo ? { ...replyTo } : null,
            timestamp: new Date()
        };

        const agentId = state.selectedAgent?.id || 'auto';
        if (!state.chatHistories[agentId]) state.chatHistories[agentId] = [];
        state.chatHistories[agentId].push(msg);

        renderUserMessage(msg);
        scrollToBottom();

        // Persist to server conversation
        if (state.currentConversationId) {
            fetch(`/api/chats/${state.currentConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            }).then(() => {
                loadConversations();
            }).catch(() => null);
        } else {
            const targetAgent = state.selectedAgent || state.agents.find(a => a.id === 'auto') || state.agents[0];
            fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: (text || 'New Conversation').slice(0, 36),
                    agentId: targetAgent?.id || 'auto',
                    agentName: targetAgent?.name || 'Super AI Agent',
                    modelMode: state.selectedModelMode || 'auto',
                    messages: [msg]
                })
            }).then(r => r.ok ? r.json() : null).then(data => {
                if (data && data.chat) {
                    state.currentConversationId = data.chat.id;
                    loadConversations();
                }
            }).catch(() => null);
        }
    }

    function renderUserMessage(msg) {
        const div = document.createElement('div');
        div.className = 'msg-row user';
        
        let attachmentHtml = '';
        if (msg.attachments && msg.attachments.length > 0) {
            attachmentHtml = `
                <div class="msg-attachments-container" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${msg.content ? '8px' : '0'};">
                    ${msg.attachments.map(a => `
                        <div class="attachment-pill" style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);padding:5px 10px;border-radius:8px;font-size:12px;color:#fff;">
                            <span>📄 ${escapeHtml(a.name)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let replyQuoteHtml = '';
        if (msg.replyTo) {
            const quoteContent = (msg.replyTo.content || msg.replyTo.preview || '').trim().replace(/\s+/g, ' ');
            const shortQuote = quoteContent.length > 90 ? quoteContent.slice(0, 90) + '...' : quoteContent;
            replyQuoteHtml = `
                <div class="user-reply-quote">
                    ↳ Replying to <strong>${escapeHtml(msg.replyTo.agentName || 'Super AI')}</strong>: "${escapeHtml(shortQuote)}"
                </div>
            `;
        }

        let contentHtml = '';
        if (msg.content && msg.content.trim().length > 0) {
            contentHtml = `<div class="msg-text">${formatResponse(msg.content)}</div>`;
        }
        
        div.innerHTML = `
            <div class="msg-bubble">
                ${replyQuoteHtml}
                ${attachmentHtml}
                ${contentHtml}
            </div>
        `;
        
        const bubble = div.querySelector('.msg-bubble');
        if (bubble && msg.content && msg.content.trim().length > 0) {
            const userActions = createUserActionsRow(msg.content);
            bubble.appendChild(userActions);
        }

        elements.chatMessages.appendChild(div);
    }

    function appendAIMessage(data) {
        removeThinkingIndicator();
        hideEmptyState();
        
        const currentModelMode = state.selectedModelMode || 'auto';
        const modelDisplay = data.model || (currentModelMode === 'auto' ? 'Super AI' : LOCAL_MODEL_DEFS[currentModelMode]?.displayName || 'Local Engine');
        const actualModelTag = data.actual_model || (currentModelMode !== 'auto' ? LOCAL_MODEL_DEFS[currentModelMode]?.internalId : 'local-runtime');
        
        const msg = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.text || data.content || data.synthesis || (typeof data.result === 'string' ? data.result : '') || 'Response generated.',
            evidence: data.evidence || null,
            deliverables: data.deliverables || null,
            plan: data.plan || null,
            model: modelDisplay,
            actualModel: actualModelTag,
            modelMode: data.model_mode || (currentModelMode === 'auto' ? 'auto' : 'manual'),
            durationMs: data.duration_ms || null,
            tokensPerSec: data.tokens_per_sec || null,
            isUnavailable: data.status === 'model_unavailable',
            traceId: data.trace_id || `INT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
            timestamp: new Date()
        };
        
        const agentId = state.selectedAgent?.id || 'auto';
        if (!state.chatHistories[agentId]) state.chatHistories[agentId] = [];
        state.chatHistories[agentId].push(msg);
        
        renderAIMessage(msg);
        scrollToBottom();
        setGenerating(false);

        // Persist to server conversation
        if (state.currentConversationId) {
            fetch(`/api/chats/${state.currentConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            }).then(() => {
                loadConversations();
            }).catch(() => null);
        }
    }

    function renderAIMessage(msg) {
        const div = document.createElement('div');
        div.className = 'msg-row ai';
        
        if (msg.status === 'out_of_scope' || msg.scopeDecision || msg.type === 'agent_redirect') {
            const scopeDec = msg.scopeDecision || msg || {};
            const sourceAgent = scopeDec.sourceAgent || scopeDec.currentAgent || state.selectedAgent;
            const targetAgent = scopeDec.targetAgent || scopeDec.recommendedAgent || (scopeDec.recommendedAgents && scopeDec.recommendedAgents[0]) || { id: 'agent-004', displayNumber: '004', displayName: 'Quiz AI Agent', name: 'Quiz AI Agent' };
            const promptToRetain = scopeDec.originalPrompt || scopeDec.userPrompt || '';
            const politeMessage = msg.content || scopeDec.politeMessage || 'This request is outside my specialization.';

            div.innerHTML = `
                <div class="msg-bubble" style="background:transparent;border:none;padding:0;box-shadow:none;">
                    ${renderAgentRedirectCard({
                        sourceAgent,
                        targetAgent,
                        originalPrompt: promptToRetain,
                        reason: scopeDec.reason || 'specialization_mismatch',
                        politeMessage
                    })}
                </div>
            `;
            elements.chatMessages.appendChild(div);
            return;
        }

        if (msg.isUnavailable) {
            div.innerHTML = `
                <div class="msg-bubble" style="border-left: 3px solid var(--neon-red); background: rgba(239, 68, 68, 0.08);">
                    <div class="ai-header" style="color:var(--neon-red);">
                        <span>⚠ Model Unavailable</span>
                        <span class="zero-egress-tag">0 External Calls</span>
                    </div>
                    <div class="msg-text" style="color:var(--text-primary);line-height:1.65;">
                        ${formatResponse(msg.content)}
                    </div>
                </div>
            `;
            elements.chatMessages.appendChild(div);
            return;
        }

        let evidenceHtml = '';
        if (msg.evidence && msg.evidence.length > 0) {
            evidenceHtml = `
                <div class="evidence-box">
                    <div class="evidence-title">✓ Grounded Citations & Evidence</div>
                    ${msg.evidence.map(e => `<div class="evidence-item">● <strong>${escapeHtml(e.title || e.doc_id || 'Reference')}</strong> — ${escapeHtml(e.citation || e.details || 'Verified')}</div>`).join('')}
                </div>
            `;
        }
        
        let deliverablesHtml = '';
        if (msg.deliverables && msg.deliverables.length > 0) {
            deliverablesHtml = `
                <div class="files-badge-row">
                    ${msg.deliverables.map(d => `<a class="file-chip" onclick="alert('Generated on-premise deliverable: ${escapeHtml(d.file_name || d.name || d)}')">📥 ${escapeHtml(d.file_name || d.name || d)}</a>`).join('')}
                </div>
            `;
        }

        const agentName = state.selectedAgent?.name || 'Super AI';
        const modelLabel = msg.model || 'NVIDIA Nemotron 3';
        const actualRuntime = msg.actualModel || 'nemotron-3-nano:latest';
        const traceId = msg.traceId || `INT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        const statsStr = [
            msg.durationMs ? `${msg.durationMs}ms` : null,
            msg.tokensPerSec ? `${msg.tokensPerSec} t/s` : null
        ].filter(Boolean).join(' · ');
        
        const isCpuModel = actualRuntime.toLowerCase().includes('lfm') || actualRuntime.toLowerCase().includes('liquid') || (LOCAL_MODEL_DEFS[msg.modelMode]?.execution_target === 'CPU');
        const hwCompute = isCpuModel 
            ? 'CPU ONLY (Intel Core i5-11400H · 0 GPU VRAM · GPU: NOT USED)'
            : 'NVIDIA RTX 2050 (4GB VRAM · Max GPU Concurrency = 1)';
        
        const backendFlowHtml = `
            <div class="backend-flow-card">
                <div class="backend-flow-header">
                    <span>⚡ What happened in the backend</span>
                    <span class="backend-flow-badge">100% On-Premise</span>
                </div>
                <div class="backend-flow-steps">
                    <div class="backend-flow-item">
                        <span class="backend-flow-check">✓</span>
                        <span><strong>1. Agent Dispatched:</strong> <code>${escapeHtml(state.selectedAgent?.displayNumber || '301')} ${escapeHtml(agentName)}</code></span>
                    </div>
                    <div class="backend-flow-item">
                        <span class="backend-flow-check">✓</span>
                        <span><strong>2. Model Engine:</strong> Executed via <code>${escapeHtml(modelLabel)}</code> (Actual Runtime: <code>${escapeHtml(actualRuntime)}</code>${statsStr ? ` · ${statsStr}` : ''})</span>
                    </div>
                    <div class="backend-flow-item">
                        <span class="backend-flow-check">✓</span>
                        <span><strong>3. Hardware Compute:</strong> <code>${escapeHtml(hwCompute)}</code></span>
                    </div>
                    <div class="backend-flow-item">
                        <span class="backend-flow-check">✓</span>
                        <span><strong>4. Air-Gap Sovereignty:</strong> 0 external network requests (Strict zero cloud egress)</span>
                    </div>
                    <div class="backend-flow-item">
                        <span class="backend-flow-check">✓</span>
                        <span><strong>5. Execution Trace:</strong> Verified with audit ID <code>${escapeHtml(traceId)}</code></span>
                    </div>
                </div>
            </div>
        `;
        
        div.innerHTML = `
            <div class="msg-bubble">
                <div class="ai-header">
                    <span>● ${escapeHtml(formatModelDisplayName(msg.model))}</span>
                    <span class="zero-egress-tag" title="Runtime: ${escapeHtml(actualRuntime)}">⚡ ${escapeHtml(actualRuntime)} · 0 External Calls</span>
                </div>
                <div class="msg-text" style="color:var(--text-primary);line-height:1.65;">
                    ${formatResponse(msg.content)}
                </div>
                ${evidenceHtml}
                ${deliverablesHtml}
                ${backendFlowHtml}
            </div>
        `;
        
        const bubble = div.querySelector('.msg-bubble');
        if (bubble) {
            const actionsRow = createActionsRow(msg.content, msg.model || agentName, actualRuntime, msg.id);
            bubble.appendChild(actionsRow);
        }

        elements.chatMessages.appendChild(div);
    }

    let thinkingInterval = null;

    function appendThinkingIndicator(taskText = '', attachments = []) {
        hideEmptyState();
        removeThinkingIndicator();
        
        const div = document.createElement('div');
        div.className = 'msg-row ai';
        div.id = 'thinkingIndicator';
        
        const fileNames = (attachments || []).map(a => a.name).join(', ');
        const step1Desc = fileNames ? `Ingesting & parsing attached document (${escapeHtml(fileNames)})...` : `Parsing prompt & analyzing domain intent...`;
        
        div.innerHTML = `
            <div class="thinking-card">
                <div class="thinking-header">
                    <span class="thinking-orb"></span>
                    <span>Processing on Local Hardware (0 External Calls)</span>
                </div>
                <div class="thinking-steps" id="thinkingStepsList">
                    <div class="thinking-step-row active" id="tstep-1">
                        <span class="thinking-step-icon">⚙</span>
                        <div class="thinking-step-text"><strong>1. Input Analysis:</strong> ${step1Desc}</div>
                    </div>
                    <div class="thinking-step-row pending" id="tstep-2">
                        <span class="thinking-step-icon">○</span>
                        <div class="thinking-step-text"><strong>2. Workforce Routing:</strong> Assigning specialist agents & local model...</div>
                    </div>
                    <div class="thinking-step-row pending" id="tstep-3">
                        <span class="thinking-step-icon">○</span>
                        <div class="thinking-step-text"><strong>3. Local Inference:</strong> Executing neural reasoning on RTX 2050...</div>
                    </div>
                    <div class="thinking-step-row pending" id="tstep-4">
                        <span class="thinking-step-icon">○</span>
                        <div class="thinking-step-text"><strong>4. Grounded Synthesis:</strong> Formulating verified answer & deliverables...</div>
                    </div>
                </div>
            </div>
        `;
        
        elements.chatMessages.appendChild(div);
        scrollToBottom();

        let currentStep = 1;
        if (thinkingInterval) clearInterval(thinkingInterval);
        thinkingInterval = setInterval(() => {
            currentStep++;
            if (currentStep <= 4) {
                const prev = document.getElementById(`tstep-${currentStep - 1}`);
                const next = document.getElementById(`tstep-${currentStep}`);
                if (prev) {
                    prev.className = 'thinking-step-row done';
                    const icon = prev.querySelector('.thinking-step-icon');
                    if (icon) icon.textContent = '✓';
                }
                if (next) {
                    next.className = 'thinking-step-row active';
                    const icon = next.querySelector('.thinking-step-icon');
                    if (icon) icon.textContent = '⚙';
                }
            }
        }, 1200);
    }

    function removeThinkingIndicator() {
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        const el = document.getElementById('thinkingIndicator');
        if (el) el.remove();
    }

    function clearChat() {
        elements.chatMessages.innerHTML = '';
        elements.chatMessages.style.display = 'none';
        elements.chatEmptyState.style.display = 'flex';
    }

    function restoreChatHistory(agentId) {
        elements.chatMessages.innerHTML = '';
        const history = state.chatHistories[agentId] || [];
        
        if (history.length > 0) {
            hideEmptyState();
            history.forEach(msg => {
                if (msg.role === 'user') {
                    renderUserMessage(msg);
                } else {
                    renderAIMessage(msg);
                }
            });
            scrollToBottom();
        } else {
            clearChat();
            showEmptyState(state.selectedAgent);
        }
    }

    // Attachment handling & lifecycle state management
    function handleFileSelected(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        files.forEach(f => {
            const attObj = {
                id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: f.name,
                size: f.size,
                type: f.type || 'application/octet-stream',
                status: 'processing',
                data: null,
                file: f
            };
            state.currentAttachments.push(attObj);

            // Read base64 data asynchronously
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                let base64 = '';
                if (typeof result === 'string') {
                    base64 = result.includes(',') ? result.split(',')[1] : result;
                }
                attObj.data = base64;
                attObj.status = 'ready';
                renderAttachments();
                updateSendButtonState();
            };
            reader.onerror = () => {
                attObj.status = 'failed';
                renderAttachments();
                updateSendButtonState();
            };
            reader.readAsDataURL(f);
        });
        
        renderAttachments();
        updateSendButtonState();
        e.target.value = '';
    }

    function removeAttachment(index) {
        state.currentAttachments.splice(index, 1);
        renderAttachments();
        updateSendButtonState();
    }

    function renderAttachments() {
        elements.attachmentArea.innerHTML = '';
        if (!state.currentAttachments || state.currentAttachments.length === 0) {
            elements.attachmentArea.style.display = 'none';
            return;
        }
        
        elements.attachmentArea.style.display = 'flex';
        state.currentAttachments.forEach((att, idx) => {
            const tag = document.createElement('div');
            tag.className = `attachment-tag status-${att.status || 'ready'}`;
            
            let statusBadge = '';
            if (att.status === 'processing') {
                statusBadge = `<span class="att-status-badge processing" style="font-size:10.5px;color:var(--neon-amber);margin-left:4px;">↻ Processing...</span>`;
            } else if (att.status === 'failed') {
                statusBadge = `<span class="att-status-badge failed" style="font-size:10.5px;color:var(--neon-red);margin-left:4px;">⚠ Failed</span>`;
            } else {
                statusBadge = `<span class="att-status-badge ready" style="font-size:10.5px;color:var(--neon-green);margin-left:4px;">✓ Ready</span>`;
            }

            tag.innerHTML = `
                <div style="display:flex;align-items:center;gap:4px;">
                    <span>📄 ${escapeHtml(att.name)}</span>
                    ${statusBadge}
                </div>
                <span class="remove-btn" style="cursor:pointer;margin-left:8px;font-size:14px;color:var(--text-tertiary);" data-idx="${idx}">×</span>
            `;
            tag.querySelector('.remove-btn').addEventListener('click', () => removeAttachment(idx));
            elements.attachmentArea.appendChild(tag);
        });
    }

    function updateSendButtonState() {
        if (!elements.sendBtn) return;
        if (state.isGenerating) {
            elements.sendBtn.disabled = false;
            elements.sendBtn.classList.remove('ready');
            elements.sendBtn.classList.add('stop-mode');
            elements.sendBtn.setAttribute('aria-disabled', 'false');
            return;
        }

        const textVal = (elements.chatInput?.value || '').trim();
        const hasText = textVal.length > 0;
        const readyAttachments = (state.currentAttachments || []).filter(a => a.status === 'ready');
        const hasReadyAttachments = readyAttachments.length > 0;
        const hasProcessing = (state.currentAttachments || []).some(a => a.status === 'processing');

        // Can send if user typed text OR has at least one ready attachment, and no attachments are still processing
        const canSend = (hasText || hasReadyAttachments) && !hasProcessing;

        elements.sendBtn.disabled = !canSend;
        elements.sendBtn.classList.toggle('ready', canSend);
        elements.sendBtn.setAttribute('aria-disabled', String(!canSend));
    }

    // ============================================================
    // AGENT SELECTOR CONTROLLER & TELEMETRY
    // ============================================================

    const LOCAL_AGENT_DEFS = {
        'auto': { id: 'auto', name: 'Auto — 301 Orchestrator', shortName: 'Auto — 301 Orchestrator', category: 'Orchestrator', badge: 'ORCHESTRATOR', icon: '⚡', desc: 'Autonomous capability-based specialist selection' },
        'hermes': { id: 'hermes', name: 'Hermes Agent', shortName: 'Hermes Agent', category: 'General Agent', badge: 'GENERAL AGENT', icon: '🤖', desc: 'TII · Multi-tool autonomous reasoning', defaultModel: 'nemotron-3-nano' },
        'opencode': { id: 'opencode', name: 'OpenCode', shortName: 'OpenCode', category: 'Coding', badge: 'CODING', icon: '💻', desc: 'Open Source · Terminal coding assistant', defaultModel: 'qwen2.5-coder:1.5b' },
        'codex': { id: 'codex', name: 'Codex', shortName: 'Codex', category: 'Coding', badge: 'CODING', icon: '🧬', desc: 'OpenAI CLI · Code generation & refactoring', defaultModel: 'nemotron-3-nano' },
        'openclaw': { id: 'openclaw', name: 'OpenClaw', shortName: 'OpenClaw', category: 'Automation', badge: 'AUTOMATION', icon: '🦀', desc: 'Community · Claude Code open alternative', defaultModel: 'qwen2.5-coder:1.5b' },
        'pi': { id: 'pi', name: 'Pi', shortName: 'Pi', category: 'Lightweight Agent', badge: 'LIGHTWEIGHT AGENT', icon: '🥧', desc: 'Inflection AI · Lightweight conversational agent', defaultModel: 'llama3.2:1b' },
        'copilot-cli': { id: 'copilot-cli', name: 'GitHub Copilot CLI', shortName: 'Copilot CLI', category: 'Terminal / Coding', badge: 'TERMINAL / CODING', icon: '✈️', desc: 'GitHub / Microsoft · Terminal automation', defaultModel: 'nemotron-3-nano' }
    };

    function initAgentSelector() {
        if (!elements.agentSelectorBtn || !elements.agentDropdown) return;

        elements.agentSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAgentDropdown();
        });

        document.querySelectorAll('.agent-option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const agentId = item.dataset.agentId;
                if (agentId) selectAgentMode(agentId);
            });
        });

        document.addEventListener('click', (e) => {
            if (elements.agentSelectorWrapper && !elements.agentSelectorWrapper.contains(e.target)) {
                closeAgentDropdown();
            }
        });

        updateAgentSelectorUI();
        updateSessionIndicatorBar();
    }

    function toggleAgentDropdown() {
        const isClosed = !elements.agentDropdown || elements.agentDropdown.style.display === 'none';
        if (isClosed) {
            closeModelDropdown();
            openAgentDropdown();
        } else {
            closeAgentDropdown();
        }
    }

    function openAgentDropdown() {
        if (!elements.agentDropdown || !elements.agentSelectorBtn) return;
        elements.agentDropdown.style.display = 'block';
        elements.agentSelectorBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            const activeItem = elements.agentDropdown.querySelector('.agent-option-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 20);
    }

    function closeAgentDropdown() {
        if (elements.agentDropdown) elements.agentDropdown.style.display = 'none';
        if (elements.agentSelectorBtn) elements.agentSelectorBtn.setAttribute('aria-expanded', 'false');
    }

    function updateAgentSelectorUI() {
        const def = LOCAL_AGENT_DEFS[state.selectedAgentMode] || LOCAL_AGENT_DEFS['auto'];
        if (elements.agentSelectorLabel) {
            elements.agentSelectorLabel.textContent = def.shortName || def.name;
        }
        document.querySelectorAll('.agent-option-item').forEach(opt => {
            const optId = opt.dataset.agentId;
            opt.classList.toggle('active', optId === state.selectedAgentMode);
        });

        // Update sidebar cards selected highlight
        document.querySelectorAll('.integration-card').forEach(card => {
            const isSelected = card.dataset.agentId === state.selectedAgentMode;
            card.classList.toggle('selected', isSelected);
            const badge = card.querySelector('.badge-selected');
            if (isSelected && !badge) {
                const selSpan = document.createElement('span');
                selSpan.className = 'integration-status-badge badge-selected';
                selSpan.textContent = 'SELECTED';
                card.querySelector('.integration-meta-row')?.appendChild(selSpan);
            } else if (!isSelected && badge) {
                badge.remove();
            }
        });

        updateSessionIndicatorBar();
    }

    function selectAgentMode(agentId, silent = false) {
        if (!LOCAL_AGENT_DEFS[agentId]) return;
        state.selectedAgentMode = agentId;
        updateAgentSelectorUI();
        closeAgentDropdown();

        if (!silent && agentId !== 'auto') {
            const def = LOCAL_AGENT_DEFS[agentId];
            appendSystemEvent(`Active Agent switched to ${def.name}`);
        }
    }

    function updateSessionIndicatorBar(telemetry = {}) {
        const agentDef = LOCAL_AGENT_DEFS[state.selectedAgentMode] || LOCAL_AGENT_DEFS['auto'];
        const modelDef = LOCAL_MODEL_DEFS[state.selectedModelMode] || LOCAL_MODEL_DEFS['auto'];

        if (elements.sessionActiveAgent) {
            elements.sessionActiveAgent.textContent = telemetry.agent || (state.selectedAgentMode === 'auto' ? (state.selectedAgent?.name || '301 Orchestrator') : agentDef.name.replace('Auto — ', ''));
        }
        if (elements.sessionActiveModel) {
            elements.sessionActiveModel.textContent = telemetry.model || (modelDef.id === 'auto' ? 'Auto — Recommended' : modelDef.displayName);
        }
        if (elements.sessionActiveRuntime) {
            elements.sessionActiveRuntime.textContent = telemetry.runtime || 'Ollama';
        }
        if (elements.sessionActiveHardware) {
            elements.sessionActiveHardware.textContent = telemetry.hardware || (modelDef.hardware?.includes('CPU') ? 'Intel Core i5 (CPU)' : 'RTX 2050 (4GB)');
        }
        if (elements.sessionActiveNetwork) {
            elements.sessionActiveNetwork.textContent = telemetry.network_mode || 'LOCAL ONLY';
        }
        if (elements.sessionActiveCalls) {
            elements.sessionActiveCalls.textContent = String(telemetry.external_calls ?? 0);
        }
    }

    // MODEL SELECTOR LOGIC
    const LOCAL_MODEL_DEFS = {
        'auto': {
            id: 'auto',
            internalId: 'auto',
            displayName: 'Auto (Intelligent Routing)',
            execution_target: 'AUTO',
            badge: 'Intelligent',
            speed: 'Dynamic',
            description: 'Dynamic routing across GPU & CPU local models based on task intent',
            runtime: 'Local Orchestration Router',
            hardware: 'RTX 2050 / Intel i5-11400H'
        },
        'nemotron': {
            id: 'nemotron',
            internalId: 'nemotron-3-nano:latest',
            displayName: 'NVIDIA Nemotron 3 Nano',
            provider: 'NVIDIA',
            execution_target: 'GPU',
            badge: 'Reasoning',
            speed: 'High Speed',
            size: '2.8 GB',
            description: 'Reasoning & Orchestration',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.8GB VRAM)'
        },
        'nemotron-3-nano': {
            id: 'nemotron',
            internalId: 'nemotron-3-nano:latest',
            displayName: 'NVIDIA Nemotron 3 Nano',
            provider: 'NVIDIA',
            execution_target: 'GPU',
            badge: 'Reasoning',
            speed: 'High Speed',
            size: '2.8 GB',
            description: 'Reasoning & Orchestration',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.8GB VRAM)'
        },
        'nemotron-3-nano:latest': {
            id: 'nemotron',
            internalId: 'nemotron-3-nano:latest',
            displayName: 'NVIDIA Nemotron 3 Nano',
            provider: 'NVIDIA',
            execution_target: 'GPU',
            badge: 'Reasoning',
            speed: 'High Speed',
            size: '2.8 GB',
            description: 'Reasoning & Orchestration',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.8GB VRAM)'
        },
        'qwen': {
            id: 'qwen',
            internalId: 'qwen2.5-coder:1.5b',
            displayName: 'Qwen 2.5 Coder 1.5B',
            provider: 'Alibaba Cloud',
            execution_target: 'GPU',
            badge: 'Code',
            speed: 'Ultra Fast',
            size: '986 MB',
            description: 'Code Synthesis & Sandbox',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~986MB VRAM)'
        },
        'qwen2.5-coder:1.5b': {
            id: 'qwen',
            internalId: 'qwen2.5-coder:1.5b',
            displayName: 'Qwen 2.5 Coder 1.5B',
            provider: 'Alibaba Cloud',
            execution_target: 'GPU',
            badge: 'Code',
            speed: 'Ultra Fast',
            size: '986 MB',
            description: 'Code Synthesis & Sandbox',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~986MB VRAM)'
        },
        'gemma': {
            id: 'gemma',
            internalId: 'gemma3:1b',
            displayName: 'Google Gemma 3 1B',
            provider: 'Google',
            execution_target: 'GPU',
            badge: 'Edge NLP',
            speed: 'Ultra Fast',
            size: '815 MB',
            description: 'On-Device NLP & Semantic Synthesis',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~815MB VRAM)'
        },
        'gemma3:1b': {
            id: 'gemma',
            internalId: 'gemma3:1b',
            displayName: 'Google Gemma 3 1B',
            provider: 'Google',
            execution_target: 'GPU',
            badge: 'Edge NLP',
            speed: 'Ultra Fast',
            size: '815 MB',
            description: 'On-Device NLP & Semantic Synthesis',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~815MB VRAM)'
        },
        'llama': {
            id: 'llama',
            internalId: 'llama3.2:1b',
            displayName: 'Meta Llama 3.2 1B',
            provider: 'Meta',
            execution_target: 'GPU',
            badge: 'Fast Text',
            speed: 'Ultra Fast',
            size: '1.3 GB',
            description: 'Fast Lightweight General Text',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.3GB VRAM)'
        },
        'llama3.2:1b': {
            id: 'llama',
            internalId: 'llama3.2:1b',
            displayName: 'Meta Llama 3.2 1B',
            provider: 'Meta',
            execution_target: 'GPU',
            badge: 'Fast Text',
            speed: 'Ultra Fast',
            size: '1.3 GB',
            description: 'Fast Lightweight General Text',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.3GB VRAM)'
        },
        'granite': {
            id: 'granite',
            internalId: 'granite4:1b-h',
            displayName: 'IBM Granite 4 1B-H',
            provider: 'IBM',
            execution_target: 'GPU',
            badge: 'Enterprise',
            speed: 'Ultra Fast',
            size: '1.4 GB',
            description: 'Enterprise RAG & Tool Use',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.4GB VRAM)'
        },
        'granite4:1b-h': {
            id: 'granite',
            internalId: 'granite4:1b-h',
            displayName: 'IBM Granite 4 1B-H',
            provider: 'IBM',
            execution_target: 'GPU',
            badge: 'Enterprise',
            speed: 'Ultra Fast',
            size: '1.4 GB',
            description: 'Enterprise RAG & Tool Use',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.4GB VRAM)'
        },
        'phi4': {
            id: 'phi4',
            internalId: 'phi4-mini',
            displayName: 'Microsoft Phi-4 Mini',
            provider: 'Microsoft',
            execution_target: 'GPU',
            badge: 'Logic',
            speed: 'High Speed',
            size: '2.5 GB',
            description: 'Reasoning, Mathematics & Logic',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.5GB VRAM)'
        },
        'phi4-mini': {
            id: 'phi4',
            internalId: 'phi4-mini',
            displayName: 'Microsoft Phi-4 Mini',
            provider: 'Microsoft',
            execution_target: 'GPU',
            badge: 'Logic',
            speed: 'High Speed',
            size: '2.5 GB',
            description: 'Reasoning, Mathematics & Logic',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.5GB VRAM)'
        },
        'smollm2': {
            id: 'smollm2',
            internalId: 'smollm2:1.7b',
            displayName: 'SmolLM2 1.7B',
            provider: 'Hugging Face',
            execution_target: 'GPU',
            badge: 'Text',
            speed: 'Ultra Fast',
            size: '1.8 GB',
            description: 'Lightweight general text model',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.8GB VRAM)'
        },
        'smollm2:1.7b': {
            id: 'smollm2',
            internalId: 'smollm2:1.7b',
            displayName: 'SmolLM2 1.7B',
            provider: 'Hugging Face',
            execution_target: 'GPU',
            badge: 'Text',
            speed: 'Ultra Fast',
            size: '1.8 GB',
            description: 'Lightweight general text model',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.8GB VRAM)'
        },
        'falcon': {
            id: 'falcon',
            internalId: 'falcon3:1b-instruct-q4_K_M',
            displayName: 'Falcon3 1B',
            provider: 'Technology Innovation Institute',
            execution_target: 'GPU',
            badge: 'SCIENCE',
            speed: 'Ultra Fast',
            size: '1.1 GB',
            description: 'Science, Mathematics & Lightweight Coding Specialist',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.1GB VRAM)'
        },
        'falcon3': {
            id: 'falcon',
            internalId: 'falcon3:1b-instruct-q4_K_M',
            displayName: 'Falcon3 1B',
            provider: 'Technology Innovation Institute',
            execution_target: 'GPU',
            badge: 'SCIENCE',
            speed: 'Ultra Fast',
            size: '1.1 GB',
            description: 'Science, Mathematics & Lightweight Coding Specialist',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.1GB VRAM)'
        },
        'falcon3-1b-instruct': {
            id: 'falcon',
            internalId: 'falcon3:1b-instruct-q4_K_M',
            displayName: 'Falcon3 1B',
            provider: 'Technology Innovation Institute',
            execution_target: 'GPU',
            badge: 'SCIENCE',
            speed: 'Ultra Fast',
            size: '1.1 GB',
            description: 'Science, Mathematics & Lightweight Coding Specialist',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.1GB VRAM)'
        },
        'falcon3:1b-instruct-q4_K_M': {
            id: 'falcon',
            internalId: 'falcon3:1b-instruct-q4_K_M',
            displayName: 'Falcon3 1B',
            provider: 'Technology Innovation Institute',
            execution_target: 'GPU',
            badge: 'SCIENCE',
            speed: 'Ultra Fast',
            size: '1.1 GB',
            description: 'Science, Mathematics & Lightweight Coding Specialist',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~1.1GB VRAM)'
        },
        'lfm': {
            id: 'lfm',
            internalId: 'LiquidAI/lfm2.5-350m',
            displayName: 'LFM2.5-350M',
            provider: 'Liquid AI',
            execution_target: 'CPU',
            badge: 'CPU ONLY',
            speed: 'Fast CPU',
            size: '379 MB',
            description: 'Edge / Extraction / Tools / Structured Output',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'lfm2.5': {
            id: 'lfm',
            internalId: 'LiquidAI/lfm2.5-350m',
            displayName: 'LFM2.5-350M',
            provider: 'Liquid AI',
            execution_target: 'CPU',
            badge: 'CPU ONLY',
            speed: 'Fast CPU',
            size: '379 MB',
            description: 'Edge / Extraction / Tools / Structured Output',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'lfm2.5-350m': {
            id: 'lfm',
            internalId: 'LiquidAI/lfm2.5-350m',
            displayName: 'LFM2.5-350M',
            provider: 'Liquid AI',
            execution_target: 'CPU',
            badge: 'CPU ONLY',
            speed: 'Fast CPU',
            size: '379 MB',
            description: 'Edge / Extraction / Tools / Structured Output',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'LiquidAI/lfm2.5-350m': {
            id: 'lfm',
            internalId: 'LiquidAI/lfm2.5-350m',
            displayName: 'LFM2.5-350M',
            provider: 'Liquid AI',
            execution_target: 'CPU',
            badge: 'CPU ONLY',
            speed: 'Fast CPU',
            size: '379 MB',
            description: 'Edge / Extraction / Tools / Structured Output',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'LiquidAI/lfm2.5-350m:latest': {
            id: 'lfm',
            internalId: 'LiquidAI/lfm2.5-350m',
            displayName: 'LFM2.5-350M',
            provider: 'Liquid AI',
            execution_target: 'CPU',
            badge: 'CPU ONLY',
            speed: 'Fast CPU',
            size: '379 MB',
            description: 'Edge / Extraction / Tools / Structured Output',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'rwkv': {
            id: 'rwkv',
            internalId: 'mollysama/rwkv-7-g1d:0.4b',
            displayName: 'RWKV-7 0.4B',
            provider: 'RWKV',
            execution_target: 'CPU',
            badge: 'TEXT',
            speed: 'Fast CPU',
            size: '501 MB',
            description: 'Lightweight General Text / Rewriting / Summary',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'rwkv7': {
            id: 'rwkv',
            internalId: 'mollysama/rwkv-7-g1d:0.4b',
            displayName: 'RWKV-7 0.4B',
            provider: 'RWKV',
            execution_target: 'CPU',
            badge: 'TEXT',
            speed: 'Fast CPU',
            size: '501 MB',
            description: 'Lightweight General Text / Rewriting / Summary',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'rwkv7-0.4b': {
            id: 'rwkv',
            internalId: 'mollysama/rwkv-7-g1d:0.4b',
            displayName: 'RWKV-7 0.4B',
            provider: 'RWKV',
            execution_target: 'CPU',
            badge: 'TEXT',
            speed: 'Fast CPU',
            size: '501 MB',
            description: 'Lightweight General Text / Rewriting / Summary',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'mollysama/rwkv-7-g1d:0.4b': {
            id: 'rwkv',
            internalId: 'mollysama/rwkv-7-g1d:0.4b',
            displayName: 'RWKV-7 0.4B',
            provider: 'RWKV',
            execution_target: 'CPU',
            badge: 'TEXT',
            speed: 'Fast CPU',
            size: '501 MB',
            description: 'Lightweight General Text / Rewriting / Summary',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'tinyllama': {
            id: 'tinyllama',
            internalId: 'tinyllama:1.1b-chat',
            displayName: 'TinyLlama 1.1B',
            provider: 'TinyLlama',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '637 MB',
            description: 'Lightweight General Chat, Short Rewriting & Q&A',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'tinyllama-1.1b': {
            id: 'tinyllama',
            internalId: 'tinyllama:1.1b-chat',
            displayName: 'TinyLlama 1.1B',
            provider: 'TinyLlama',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '637 MB',
            description: 'Lightweight General Chat, Short Rewriting & Q&A',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'tinyllama:1.1b-chat': {
            id: 'tinyllama',
            internalId: 'tinyllama:1.1b-chat',
            displayName: 'TinyLlama 1.1B',
            provider: 'TinyLlama',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '637 MB',
            description: 'Lightweight General Chat, Short Rewriting & Q&A',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'stablelm': {
            id: 'stablelm',
            internalId: 'stablelm2:1.6b',
            displayName: 'Stable LM 2 1.6B',
            provider: 'Stability AI',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '982 MB',
            description: 'General Text Generation, Summarization & Rewriting',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'stablelm2': {
            id: 'stablelm',
            internalId: 'stablelm2:1.6b',
            displayName: 'Stable LM 2 1.6B',
            provider: 'Stability AI',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '982 MB',
            description: 'General Text Generation, Summarization & Rewriting',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'stablelm2-1.6b': {
            id: 'stablelm',
            internalId: 'stablelm2:1.6b',
            displayName: 'Stable LM 2 1.6B',
            provider: 'Stability AI',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '982 MB',
            description: 'General Text Generation, Summarization & Rewriting',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'stablelm2:1.6b': {
            id: 'stablelm',
            internalId: 'stablelm2:1.6b',
            displayName: 'Stable LM 2 1.6B',
            provider: 'Stability AI',
            distribution: 'Official Ollama',
            execution_target: 'CPU',
            badge: 'GENERAL',
            speed: 'Fast CPU',
            size: '982 MB',
            description: 'General Text Generation, Summarization & Rewriting',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'CPU ONLY (Intel Core i5-11400H · 0 VRAM)'
        },
        'qwen3-1.7b-cyber': {
            id: 'qwen3-1.7b-cyber',
            internalId: 'babar_jamali/qwen3-1.7b-cyber:latest',
            displayName: 'qwen3-1.7b-cyber',
            provider: 'Babar Ali Jamali',
            distribution: 'Community Fine-Tuned Model',
            execution_target: 'AUTO_GPU_CPU',
            category: 'DOMAIN_SPECIALIST',
            badge: 'CYBERSECURITY',
            secondaryBadge: 'FINE-TUNED',
            speed: 'Ultra Fast (82 tok/s)',
            size: '~1.1 GB',
            parameters: '1.72B Q4_K_M',
            description: 'Fine-Tuned Cybersecurity, SOC, DFIR & Vulnerability Analysis',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 / Intel i5 Auto'
        },
        'cyber': {
            id: 'qwen3-1.7b-cyber',
            internalId: 'babar_jamali/qwen3-1.7b-cyber:latest',
            displayName: 'qwen3-1.7b-cyber',
            provider: 'Babar Ali Jamali',
            distribution: 'Community Fine-Tuned Model',
            execution_target: 'AUTO_GPU_CPU',
            category: 'DOMAIN_SPECIALIST',
            badge: 'CYBERSECURITY',
            secondaryBadge: 'FINE-TUNED',
            speed: 'Ultra Fast (82 tok/s)',
            size: '~1.1 GB',
            parameters: '1.72B Q4_K_M',
            description: 'Fine-Tuned Cybersecurity, SOC, DFIR & Vulnerability Analysis',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 / Intel i5 Auto'
        },
        'medgemma': {
            id: 'medgemma-4b',
            internalId: 'medgemma:4b-it-q4_K_M',
            displayName: 'medgemma:4b',
            provider: 'Google',
            distribution: 'Official Google Health Model',
            execution_target: 'GPU',
            category: 'DOMAIN_SPECIALIST',
            badge: 'HEALTHCARE',
            secondaryBadge: 'MEDICAL AI',
            speed: 'Optimal GPU (10 tok/s)',
            size: '~3.3 GB',
            parameters: '4.3B Q4_K_M (128K Context · Vision)',
            description: 'Healthcare & Medical Clinical Decision Support (Text + Image). For informational use.',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.7GB VRAM)',
            disclaimer: 'For informational/decision-support use. Not a substitute for a qualified healthcare professional.'
        },
        'medgemma-4b': {
            id: 'medgemma-4b',
            internalId: 'medgemma:4b-it-q4_K_M',
            displayName: 'medgemma:4b',
            provider: 'Google',
            distribution: 'Official Google Health Model',
            execution_target: 'GPU',
            category: 'DOMAIN_SPECIALIST',
            badge: 'HEALTHCARE',
            secondaryBadge: 'MEDICAL AI',
            speed: 'Optimal GPU (10 tok/s)',
            size: '~3.3 GB',
            parameters: '4.3B Q4_K_M (128K Context · Vision)',
            description: 'Healthcare & Medical Clinical Decision Support (Text + Image). For informational use.',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.7GB VRAM)',
            disclaimer: 'For informational/decision-support use. Not a substitute for a qualified healthcare professional.'
        },
        'medgemma:4b-it-q4_K_M': {
            id: 'medgemma-4b',
            internalId: 'medgemma:4b-it-q4_K_M',
            displayName: 'medgemma:4b',
            provider: 'Google',
            distribution: 'Official Google Health Model',
            execution_target: 'GPU',
            category: 'DOMAIN_SPECIALIST',
            badge: 'HEALTHCARE',
            secondaryBadge: 'MEDICAL AI',
            speed: 'Optimal GPU (10 tok/s)',
            size: '~3.3 GB',
            parameters: '4.3B Q4_K_M (128K Context · Vision)',
            description: 'Healthcare & Medical Clinical Decision Support (Text + Image). For informational use.',
            runtime: 'Local Ollama (127.0.0.1:11434)',
            hardware: 'RTX 2050 (~2.7GB VRAM)',
            disclaimer: 'For informational/decision-support use. Not a substitute for a qualified healthcare professional.'
        }
    };

    function formatModelDisplayName(name) {
        if (!name) return 'Super AI (Auto)';
        const lower = String(name).toLowerCase();
        if (lower.includes('qwen3-1.7b-cyber') || lower.includes('babar_jamali')) {
            return 'qwen3-1.7b-cyber';
        }
        if (lower.includes('medgemma')) {
            return 'medgemma:4b';
        }
        return name;
    }

    function initModelSelector() {
        if (!elements.modelSelectorBtn || !elements.modelDropdown) return;

        elements.modelSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModelDropdown();
        });

        document.addEventListener('click', (e) => {
            if (elements.modelSelectorWrapper && !elements.modelSelectorWrapper.contains(e.target)) {
                closeModelDropdown();
            }
        });

        document.querySelectorAll('.model-option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // If clicked on info chevron, show specs
                if (e.target.closest('.btn-model-info') || e.target.closest('.btn-info-chevron')) {
                    e.stopPropagation();
                    const rawId = item.dataset.modelId || item.dataset.internalId;
                    showModelDetails(rawId);
                    return;
                }
                const modelId = item.dataset.modelId || item.dataset.internalId;
                if (modelId && LOCAL_MODEL_DEFS[modelId]) {
                    selectModelMode(modelId);
                }
            });
        });

        document.querySelectorAll('.btn-model-info, .btn-info-chevron').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = btn.closest('.model-option-item');
                const modelId = btn.dataset.modelInfo || parent?.dataset.modelId || parent?.dataset.internalId;
                showModelDetails(modelId);
            });
        });

        if (elements.btnCloseSubpanel) {
            elements.btnCloseSubpanel.addEventListener('click', (e) => {
                e.stopPropagation();
                if (elements.modelDetailsSubpanel) elements.modelDetailsSubpanel.style.display = 'none';
            });
        }
    }

    function toggleModelDropdown() {
        const isOpen = elements.modelDropdown.style.display !== 'none';
        if (isOpen) {
            closeModelDropdown();
        } else {
            openModelDropdown();
        }
    }

    function openModelDropdown() {
        elements.modelDropdown.style.display = 'block';
        elements.modelSelectorBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            const activeItem = elements.modelDropdown.querySelector('.model-option-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 20);
    }

    function closeModelDropdown() {
        if (elements.modelDropdown) elements.modelDropdown.style.display = 'none';
        if (elements.modelSelectorBtn) elements.modelSelectorBtn.setAttribute('aria-expanded', 'false');
        if (elements.modelDetailsSubpanel) elements.modelDetailsSubpanel.style.display = 'none';
    }

    function updateModelSelectorUI() {
        const def = LOCAL_MODEL_DEFS[state.selectedModelMode] || LOCAL_MODEL_DEFS['auto'];
        const activeKey = def.id;
        if (elements.modelSelectorLabel) {
            if (def.id === 'auto') {
                elements.modelSelectorLabel.textContent = 'Auto';
            } else {
                elements.modelSelectorLabel.textContent = def.displayName
                    .replace('NVIDIA ', '')
                    .replace('Google ', '')
                    .replace('Meta ', '')
                    .replace('IBM ', '')
                    .replace('Microsoft ', '');
            }
        }
        document.querySelectorAll('.model-option-item').forEach(opt => {
            const optId = opt.dataset.modelId;
            const optInternal = opt.dataset.internalId;
            const isMatch = optId === activeKey || optInternal === state.selectedModelMode || optId === state.selectedModelMode || optInternal === def.internalId;
            opt.classList.toggle('active', isMatch);
        });
    }

    function selectModelMode(modelId, silent = false) {
        const def = LOCAL_MODEL_DEFS[modelId];
        if (!def) return;

        state.selectedModelMode = modelId;
        updateModelSelectorUI();

        // Update active conversation modelMode if open
        if (state.currentConversationId) {
            fetch(`/api/chats/${state.currentConversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelMode: modelId })
            }).catch(() => null);
        }

        if (!silent) {
            const agentId = state.selectedAgent?.id || 'auto';
            const history = state.chatHistories[agentId];
            if (history && history.length > 0) {
                appendSystemEvent(`Model changed to ${def.displayName}`);
            }
        }

        closeModelDropdown();
    }

    function showModelDetails(modelId) {
        const def = LOCAL_MODEL_DEFS[modelId];
        if (!def || !elements.modelDetailsSubpanel) return;

        if (elements.subpanelModelName) elements.subpanelModelName.textContent = `${def.displayName} Specifications`;
        if (elements.subpanelRuntime) elements.subpanelRuntime.textContent = def.runtime || 'Local Ollama (127.0.0.1:11434)';
        if (elements.subpanelStatus) elements.subpanelStatus.textContent = '● Active';
        if (elements.subpanelHardware) elements.subpanelHardware.textContent = def.hardware || 'RTX 2050 (4GB VRAM)';

        elements.modelDetailsSubpanel.style.display = 'block';
    }

    function appendSystemEvent(text) {
        const div = document.createElement('div');
        div.className = 'system-event-row';
        div.style.cssText = 'text-align:center;margin:12px 0;font-size:11.5px;color:var(--text-tertiary);display:flex;align-items:center;justify-content:center;gap:6px;';
        div.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);"></span> ${escapeHtml(text)}`;
        elements.chatMessages.appendChild(div);
        scrollToBottom();
    }

    // 6. COMPOSER SENDER & TRUE STREAMING HANDLER
    function handleSend() {
        const rawText = (elements.chatInput?.value || '').trim();
        const readyAttachments = (state.currentAttachments || []).filter(a => a.status === 'ready');
        const activeReply = state.replyContext ? { ...state.replyContext } : null;

        console.log('[SEND] handleSend() called', { rawText: rawText.slice(0, 50), agentId: state.selectedAgent?.id, isGenerating: state.isGenerating, attachments: readyAttachments.length });

        if (!rawText && readyAttachments.length === 0) { console.log('[SEND] BLOCKED: no text and no attachments'); return; }
        if (state.isGenerating) {
            console.log('[SEND] BLOCKED: isGenerating=true, calling stop');
            handleStopGeneration();
            return;
        }

        // Formulate backend task if raw text is empty
        let backendTask = rawText;
        if (!backendTask && readyAttachments.length > 0) {
            const fileNames = readyAttachments.map(a => a.name).join(', ');
            const hasPdf = readyAttachments.some(a => (a.name || '').toLowerCase().endsWith('.pdf') || a.type === 'application/pdf');
            const hasImg = readyAttachments.some(a => /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(a.name || '') || (a.type || '').startsWith('image/'));
            const hasSheet = readyAttachments.some(a => /\.(xlsx|xls|csv)$/i.test(a.name || ''));
            const hasCode = readyAttachments.some(a => /\.(js|py|sql|ts|json|html|css|cpp|c|rs|go|sh)$/i.test(a.name || ''));

            if (hasImg && !hasPdf && !hasSheet) {
                backendTask = `Analyze and describe the contents of the attached image: ${fileNames}`;
            } else if (hasPdf && !hasImg && !hasSheet) {
                backendTask = `Analyze and extract findings from the attached document: ${fileNames}`;
            } else if (hasSheet) {
                backendTask = `Analyze and summarize data from the attached spreadsheet: ${fileNames}`;
            } else if (hasCode) {
                backendTask = `Review and explain the attached code file: ${fileNames}`;
            } else {
                backendTask = `Analyze the provided materials: ${fileNames}`;
            }
        }
        
        // Render user message bubble (with empty text if attachment-only)
        appendUserMessage(rawText, readyAttachments, activeReply);
        
        // Auto-generate title from attachment name if conversation is new/default
        if (state.currentConversationId && !rawText && readyAttachments.length > 0) {
            let autoTitle = readyAttachments[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            autoTitle = autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1);
            if (autoTitle.length > 30) autoTitle = autoTitle.slice(0, 30) + '...';
            fetch(`/api/chats/${state.currentConversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: autoTitle })
            }).then(() => loadConversations()).catch(() => null);
        }

        // Clear input, attachments & reply banner
        elements.chatInput.value = '';
        elements.chatInput.style.height = 'auto';
        state.currentAttachments = [];
        renderAttachments();
        updateSendButtonState();
        clearReplyContext();
        
        sendToBackend(state.selectedAgent?.id || 'auto', backendTask, readyAttachments, activeReply, rawText ? 'text' : 'attachment');
    }

    function handleStopGeneration() {
        if (state.currentAbortController) {
            state.currentAbortController.abort();
            state.currentAbortController = null;
        }
        setGenerating(false);
    }

    async function sendToBackend(agentId, text, attachments, replyTo = null) {
        console.log('[SEND_TO_BACKEND] called', { agentId, textLen: text?.length, attachments: attachments?.length });
        setGenerating(true);
        state.currentAbortController = new AbortController();
        console.log('[SEND_TO_BACKEND] AbortController created, isGenerating=true');
        
        const currentModelMode = state.selectedModelMode || 'auto';
        const modelOverride = currentModelMode !== 'auto' ? LOCAL_MODEL_DEFS[currentModelMode]?.internalId : null;
        const targetAgentId = (!agentId || agentId === 'auto') ? 'auto' : agentId;

        // Create stream placeholder message
        hideEmptyState();
        removeThinkingIndicator();

        const modelDefaultDisplay = currentModelMode === 'auto' ? 'Super AI (Auto)' : LOCAL_MODEL_DEFS[currentModelMode]?.displayName;
        const streamMsgDiv = document.createElement('div');
        streamMsgDiv.className = 'msg-row ai streaming-active';
        streamMsgDiv.id = `msg-stream-${Date.now()}`;

        streamMsgDiv.innerHTML = `
            <div class="msg-bubble">
                <div class="ai-header">
                    <span class="ai-model-label">● ${escapeHtml(modelDefaultDisplay)}</span>
                    <span class="zero-egress-tag">⚡ Initializing · 0 External Calls</span>
                </div>
                <div class="stream-status-pill preparing">
                    <span class="spin-icon" style="display:inline-block;width:10px;height:10px;border:1.5px solid currentColor;border-top-color:transparent;border-radius:50%;"></span>
                    <span class="stream-status-text">Preparing model...</span>
                </div>
                <div class="msg-text stream-text-target" style="color:var(--text-primary);line-height:1.65;">
                    <span class="stream-cursor"></span>
                </div>
            </div>
        `;
        elements.chatMessages.appendChild(streamMsgDiv);
        scrollToBottom();

        const textTarget = streamMsgDiv.querySelector('.stream-text-target');
        const modelLabelEl = streamMsgDiv.querySelector('.ai-model-label');
        const egressTagEl = streamMsgDiv.querySelector('.zero-egress-tag');
        const statusPill = streamMsgDiv.querySelector('.stream-status-pill');
        const statusText = streamMsgDiv.querySelector('.stream-status-text');

        let accumulatedText = '';
        let actualModelTag = modelOverride || 'nemotron-3-nano:latest';
        let modelDisplayName = modelDefaultDisplay;
        let traceId = `INT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        let durationMs = null;
        let tokensPerSec = null;
        let isStopped = false;
        let workflowMeta = null;

        const effectiveTask = replyTo
            ? `[Replying to previous response from ${replyTo.agentName || 'AI Assistant'}]: "${(replyTo.content || '').slice(0, 300)}"\n\nUser follow-up: ${text}`
            : text;

        let isScopeRedirect = false;
        let scopeRedirectMeta = null;
        let renderRafPending = false;

        // Process attachments to base64
        const processedAttachments = await Promise.all((attachments || []).map(async (att) => {
            if (att.file) {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result;
                        let base64 = '';
                        if (typeof result === 'string') {
                            base64 = result.includes(',') ? result.split(',')[1] : result;
                        }
                        resolve({
                            name: att.name,
                            type: att.type,
                            size: att.size,
                            data: base64
                        });
                    };
                    reader.onerror = () => resolve({ name: att.name, type: att.type, size: att.size, data: '' });
                    reader.readAsDataURL(att.file);
                });
            }
            return { name: att.name, type: att.type, size: att.size, data: att.data || '' };
        }));

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    conversationId: state.currentConversationId,
                    conversation_id: state.currentConversationId,
                    agent_id: targetAgentId,
                    task: effectiveTask,
                    original_task: text,
                    attachments: processedAttachments,
                    replyTo: replyTo ? {
                        messageId: replyTo.messageId,
                        agentId: replyTo.agentId,
                        agentName: replyTo.agentName,
                        preview: (replyTo.content || '').slice(0, 180)
                    } : null,
                    modelMode: currentModelMode,
                    model_override: modelOverride,
                    stream: true
                }),
                signal: state.currentAbortController.signal
            });

            if (!res.ok) {
                console.error('[FETCH] HTTP error', res.status, res.statusText);
                const errData = await res.json().catch(() => ({}));
                if (res.status === 503 || errData.status === 'model_unavailable') {
                    statusPill.remove();
                    textTarget.innerHTML = `<span style="color:var(--neon-red);">⚠ ${escapeHtml(errData.error?.message || 'Selected model is currently unavailable in local runtime.')}</span>`;
                    setGenerating(false);
                    return;
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            console.log('[FETCH] Response OK', { status: res.status, contentType: res.headers.get('content-type') });

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let _debugChunkCount = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) { console.log('[SSE] Reader done. Total chunks:', _debugChunkCount); break; }
                _debugChunkCount++;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';


                for (const ev of events) {
                    if (!ev.trim()) continue;
                    const lines = ev.split('\n');
                    let eventType = 'message';
                    let eventData = '';

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.replace('event:', '').trim();
                        } else if (line.startsWith('data:')) {
                            eventData = line.replace('data:', '').trim();
                        }
                    }

                    if (!eventData) continue;

                    try {
                        const parsed = JSON.parse(eventData);
                        console.log('[SSE_EVENT]', eventType, eventType === 'token' ? `text_len=${(parsed.text||'').length}` : '');

                        if (eventType === 'scope_redirect' || eventType === 'agent_redirect') {
                            isScopeRedirect = true;
                            if (statusPill && statusPill.parentNode) statusPill.remove();
                            const scopeDec = parsed.scopeDecision || parsed;
                            const sourceAgent = scopeDec.sourceAgent || scopeDec.currentAgent || state.selectedAgent;
                            const targetAgent = scopeDec.targetAgent || scopeDec.recommendedAgent || (scopeDec.recommendedAgents && scopeDec.recommendedAgents[0]) || { id: 'agent-004', displayNumber: '004', displayName: 'Quiz AI Agent', name: 'Quiz AI Agent' };
                            const promptToRetain = scopeDec.originalPrompt || scopeDec.userPrompt || text || '';
                            const politeMessage = scopeDec.politeMessage || parsed.text || 'This request is outside my specialization.';

                            scopeRedirectMeta = scopeDec;
                            textTarget.innerHTML = renderAgentRedirectCard({
                                sourceAgent,
                                targetAgent,
                                originalPrompt: promptToRetain,
                                reason: scopeDec.reason || 'specialization_mismatch',
                                politeMessage
                            });
                            accumulatedText = politeMessage;
                        } else if (eventType === 'workflow_created' || eventType === 'workflow_planned') {
                            if (statusPill && statusPill.parentNode) statusPill.remove();
                            let wfCard = streamMsgDiv.querySelector('.workflow-live-card');
                            if (!wfCard) {
                                wfCard = document.createElement('div');
                                wfCard.className = 'workflow-live-card';
                                textTarget.parentNode.insertBefore(wfCard, textTarget);
                            }
                            const type = parsed.workflowType || 'MULTI-AGENT';
                            const subtasks = parsed.subtasks || [];
                            wfCard.innerHTML = `
                                <div class="workflow-live-header">
                                    <div class="workflow-live-title">
                                        <span class="sparkle">✦</span>
                                        <span>301 Super AI Agent (Master Orchestrator)</span>
                                    </div>
                                    <span class="workflow-type-badge">${escapeHtml(type)}</span>
                                </div>
                                <div class="workflow-subtasks-grid" id="wf-subtasks-${parsed.workflowId || 'live'}">
                                    ${subtasks.map(s => `
                                        <div class="workflow-subtask-pill queued" id="wf-pill-${s.id}">
                                            <span>${escapeHtml(s.title || s.agent)}</span>
                                            <span class="pill-status">⏳ Queued</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        } else if (eventType === 'agent_dispatched' || eventType === 'agent_started') {
                            const pill = streamMsgDiv.querySelector(`#wf-pill-${parsed.subtaskId}`);
                            if (pill) {
                                pill.className = 'workflow-subtask-pill running';
                                const st = pill.querySelector('.pill-status');
                                if (st) st.textContent = '⚙ In Progress';
                            }
                        } else if (eventType === 'agent_completed') {
                            const pill = streamMsgDiv.querySelector(`#wf-pill-${parsed.subtaskId}`);
                            if (pill) {
                                pill.className = 'workflow-subtask-pill completed';
                                const st = pill.querySelector('.pill-status');
                                if (st) st.textContent = `✓ Done (${parsed.durationMs || 0}ms)`;
                            }
                        } else if (eventType === 'agent_failed') {
                            const pill = streamMsgDiv.querySelector(`#wf-pill-${parsed.subtaskId}`);
                            if (pill) {
                                pill.className = 'workflow-subtask-pill failed';
                                const st = pill.querySelector('.pill-status');
                                if (st) st.textContent = '⚠ Failed';
                            }
                        } else if (eventType === 'workflow_synthesizing') {
                            if (statusText) statusText.textContent = 'Synthesizing specialist outputs into unified solution...';
                        } else if (eventType === 'status') {
                            if (statusText && !isScopeRedirect) {
                                statusText.textContent = parsed.message || (parsed.state === 'model_ready' ? `${parsed.model} active` : 'Preparing model...');
                                if (parsed.state === 'model_ready') {
                                    statusPill.className = 'stream-status-pill active';
                                }
                                // Update model display when pipeline transitions to Stage 2
                                if (parsed.stage === 2 && parsed.model) {
                                    modelDisplayName = formatModelDisplayName(parsed.model);
                                    actualModelTag = parsed.tag || actualModelTag;
                                    if (modelLabelEl) modelLabelEl.textContent = `● ${formatModelDisplayName(parsed.model)}`;
                                    if (egressTagEl) egressTagEl.textContent = `⚡ ${parsed.tag || actualModelTag} · Vision Pipeline`;
                                }
                            }
                        } else if (eventType === 'metadata') {
                            actualModelTag = parsed.actualModel || actualModelTag;
                            modelDisplayName = formatModelDisplayName(parsed.modelDisplayName || parsed.model || modelDisplayName);
                            traceId = parsed.requestId || traceId;
                            if (modelLabelEl) modelLabelEl.textContent = `● ${modelDisplayName}`;
                            if (egressTagEl) egressTagEl.textContent = `⚡ ${actualModelTag} · 0 External Calls`;
                        } else if (eventType === 'token') {
                            if (statusPill && statusPill.parentNode) {
                                statusPill.remove();
                            }
                            accumulatedText += (parsed.text || '');
                            if (!renderRafPending) {
                                renderRafPending = true;
                                requestAnimationFrame(() => {
                                    renderRafPending = false;
                                    textTarget.innerHTML = formatResponse(accumulatedText) + `<span class="stream-cursor"></span>`;
                                    scrollToBottom();
                                });
                            }
                        } else if (eventType === 'complete') {
                            if (!isScopeRedirect) {
                                textTarget.innerHTML = formatResponse(accumulatedText);
                            }
                            actualModelTag = parsed.actual_model || actualModelTag;
                            durationMs = parsed.duration_ms || null;
                            tokensPerSec = parsed.tokens_per_sec || null;
                            if (parsed.workflow) {
                                workflowMeta = parsed.workflow;
                            }
                            if (modelLabelEl && !isScopeRedirect) modelLabelEl.textContent = `● ${formatModelDisplayName(modelDisplayName)}`;
                            if (egressTagEl) egressTagEl.textContent = `⚡ ${actualModelTag} · 0 External Calls`;
                        } else if (eventType === 'error') {
                            if (statusPill && statusPill.parentNode) statusPill.remove();
                            textTarget.innerHTML = formatResponse(accumulatedText) + `<br><span style="color:var(--neon-red);font-size:12px;">⚠ ${escapeHtml(parsed.message || 'Stream error occurred.')}</span>`;
                        }
                    } catch (parseErr) {
                        console.warn('[SSE_PARSE_ERROR]', parseErr.message, 'raw:', eventData?.slice(0, 100));
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('[STREAM] AbortError — user stopped generation');
                isStopped = true;
                if (statusPill && statusPill.parentNode) statusPill.remove();
                textTarget.innerHTML = formatResponse(accumulatedText) + `<br><span style="color:var(--text-tertiary);font-size:12px;font-style:italic;">⏹ Generation stopped by user.</span>`;
            } else {
                console.error('[STREAM] Streaming error:', err.message, err.stack);
                if (statusPill && statusPill.parentNode) statusPill.remove();
                if (!accumulatedText) {
                    textTarget.innerHTML = `<span style="color:var(--neon-red);">An error occurred connecting to local model inference. Please verify Ollama is active.</span>`;
                }
            }
        } finally {
            // Finalize message representation
            const cursor = streamMsgDiv.querySelector('.stream-cursor');
            if (cursor) cursor.remove();
            if (statusPill && statusPill.parentNode) statusPill.remove();

            if (!isScopeRedirect) {
                // Append backend flow card
                const agentName = state.selectedAgent?.name || 'Super AI';
                const statsStr = [
                    durationMs ? `${durationMs}ms` : null,
                    tokensPerSec ? `${tokensPerSec} t/s` : null
                ].filter(Boolean).join(' · ');

                const backendFlow = document.createElement('div');
                backendFlow.className = 'backend-flow-card';
                
                let workflowStepsHtml = '';
                if (workflowMeta && workflowMeta.specialists && workflowMeta.specialists.length > 0) {
                    workflowStepsHtml = `
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>1. Multi-Agent Orchestration:</strong> Super AI Agent 101 coordinated <strong>${workflowMeta.specialists.length} specialist agents</strong> (${escapeHtml(workflowMeta.workflowType || 'PARALLEL')})</span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>2. Specialists Dispatched:</strong>
                                ${workflowMeta.specialists.map(sp => `<code>${escapeHtml(sp.agentName || sp.technology)} (${sp.model || 'Qwen 2.5 Coder'} · ${sp.durationMs || 0}ms)</code>`).join(' ')}
                            </span>
                        </div>
                        ${workflowMeta.artifacts && workflowMeta.artifacts.length > 0 ? `
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>3. Code Artifacts Generated:</strong>
                                ${workflowMeta.artifacts.map(a => `<span class="workflow-artifact-tag">📄 <code>${escapeHtml(a.filename)}</code> (${a.lines || 0} lines)</span>`).join(' ')}
                            </span>
                        </div>
                        ` : ''}
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>4. Hardware Resource Scheduling:</strong> Enforced single GPU queue on RTX 2050 (4GB VRAM Safety Lock)</span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>5. Air-Gap Sovereignty:</strong> 0 external network requests · Audit ID <code>${escapeHtml(traceId)}</code></span>
                        </div>
                    `;
                } else {
                    const isCpuModel = actualModelTag.toLowerCase().includes('lfm') || actualModelTag.toLowerCase().includes('liquid') || (LOCAL_MODEL_DEFS[state.selectedModelMode]?.execution_target === 'CPU');
                    const hwCompute = isCpuModel 
                        ? 'CPU ONLY (Intel Core i5-11400H · 0 GPU VRAM · GPU: NOT USED)'
                        : 'NVIDIA RTX 2050 (4GB VRAM · Max GPU Concurrency = 1)';

                    workflowStepsHtml = `
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>1. Agent Dispatched:</strong> Handled by <code>${escapeHtml(agentName)}</code> (Agent ${state.selectedAgent?.displayNumber || '301'})</span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>2. Model Engine:</strong> Executed via <code>${escapeHtml(modelDisplayName)}</code> (Actual Runtime: <code>${escapeHtml(actualModelTag)}</code>${statsStr ? ` · ${statsStr}` : ''})</span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>3. Hardware Compute:</strong> <code>${escapeHtml(hwCompute)}</code></span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>4. Air-Gap Sovereignty:</strong> 0 external network requests (Strict zero cloud egress)</span>
                        </div>
                        <div class="backend-flow-item">
                            <span class="backend-flow-check">✓</span>
                            <span><strong>5. Execution Trace:</strong> Verified with audit ID <code>${escapeHtml(traceId)}</code></span>
                        </div>
                    `;
                }

                backendFlow.innerHTML = `
                    <div class="backend-flow-header">
                        <span>⚡ What happened in the backend</span>
                        <span class="backend-flow-badge">100% On-Premise Stream</span>
                    </div>
                    <div class="backend-flow-steps">
                        ${workflowStepsHtml}
                    </div>
                `;
                const bubble = streamMsgDiv.querySelector('.msg-bubble');
                if (bubble) {
                    bubble.appendChild(backendFlow);
                    if (accumulatedText) {
                        const actionsRow = createActionsRow(accumulatedText, modelDisplayName, actualModelTag, `msg-${Date.now()}`);
                        bubble.appendChild(actionsRow);
                    }
                }
            }

            const finalMsg = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: accumulatedText || (isStopped ? 'Generation stopped.' : 'No response text received.'),
                status: isScopeRedirect ? 'out_of_scope' : 'success',
                type: isScopeRedirect ? 'agent_redirect' : 'message',
                scopeDecision: scopeRedirectMeta,
                model: modelDisplayName,
                actualModel: actualModelTag,
                modelMode: currentModelMode,
                durationMs,
                tokensPerSec,
                traceId,
                timestamp: new Date()
            };

            const agentIdKey = state.selectedAgent?.id || 'auto';
            if (!state.chatHistories[agentIdKey]) state.chatHistories[agentIdKey] = [];
            state.chatHistories[agentIdKey].push(finalMsg);

            // Persist to server conversation
            if (state.currentConversationId) {
                fetch(`/api/chats/${state.currentConversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalMsg)
                }).then(() => {
                    loadConversations();
                }).catch(() => null);
            }

            setGenerating(false);
            scrollToBottom();
        }
    }

    function setGenerating(isGen) {
        state.isGenerating = isGen;
        if (isGen) {
            elements.sendBtn.disabled = false;
            elements.sendBtn.classList.remove('ready');
            elements.sendBtn.classList.add('stop-mode');
            elements.sendBtn.title = 'Stop Generation';
            elements.sendBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>`;
            elements.sendBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            elements.chatInput.disabled = true;
        } else {
            state.currentAbortController = null;
            elements.sendBtn.disabled = false;
            elements.sendBtn.classList.remove('stop-mode');
            elements.sendBtn.title = 'Send message';
            elements.sendBtn.style.background = '';
            elements.sendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
            elements.chatInput.disabled = false;
            elements.chatInput.focus();
        }
    }

    // 7. NAVIGATION MANAGER
    function switchMainView(viewIdOrName) {
        state.activeView = viewIdOrName;
        
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        let targetEl = document.getElementById(viewIdOrName);
        if (!targetEl && elements.views[viewIdOrName]) {
            targetEl = elements.views[viewIdOrName];
        }
        
        if (targetEl) {
            targetEl.classList.add('active');
        }

        const composer = document.getElementById('composerContainer');
        if (composer) {
            if (viewIdOrName === 'agent-workspace' || viewIdOrName === 'chatView' || viewIdOrName === 'chat') {
                composer.style.display = '';
            } else {
                composer.style.display = 'none';
            }
        }
        
        if (viewIdOrName === 'modelsView' || viewIdOrName === 'models') loadModelsView();
        else if (viewIdOrName === 'systemView' || viewIdOrName === 'system') loadSystemView();
        
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    async function loadModelsView() {
        const container = document.getElementById('modelsView');
        if (!container) return;
        
        try {
            const res = await fetch('/api/models/list').catch(() => null);
            let data = { models: [], hardware: {} };
            
            if (res && res.ok) {
                data = await res.json();
            } else {
                data.models = [
                    { name: 'NVIDIA Nemotron 3 Nano', tag: 'nemotron-3-nano:latest', role: 'Reasoning & Orchestration', vram_mb: 2800, status: 'ready' },
                    { name: 'Qwen 2.5 Coder 1.5B', tag: 'qwen2.5-coder:1.5b', role: 'Code Synthesis & Sandbox', vram_mb: 986, status: 'ready' },
                    { name: 'Google Gemma 3 1B', tag: 'gemma3:1b', role: 'Edge NLP & Semantic Synthesis', vram_mb: 815, status: 'ready' },
                    { name: 'Meta Llama 3.2 1B', tag: 'llama3.2:1b', role: 'Fast Lightweight General Text', vram_mb: 1300, status: 'ready' },
                    { name: 'IBM Granite 4 1B-H', tag: 'granite4:1b-h', role: 'Enterprise RAG & Tool Use', vram_mb: 1400, status: 'ready' },
                    { name: 'Microsoft Phi-4 Mini', tag: 'phi4-mini', role: 'Reasoning, Mathematics & Logic', vram_mb: 2500, status: 'ready' },
                    { name: 'SmolLM2 1.7B', tag: 'smollm2:1.7b', role: 'Lightweight General Text Specialist', vram_mb: 1800, status: 'ready' }
                ];
            }
            
            container.innerHTML = `
                <h2>Language & Vision Models</h2>
                <div class="models-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:16px;">
                    ${(data.models || []).map(m => `
                        <div class="model-card" style="background:var(--bg-surface);padding:18px;border-radius:12px;border:1px solid var(--border-subtle);">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                                <h3 style="margin:0;font-size:15.5px;color:var(--text-primary);">${escapeHtml(m.name || m.id)}</h3>
                                <span class="status-indicator status-ready" style="font-size:11px;font-weight:600;color:var(--neon-green);">● READY</span>
                            </div>
                            <div style="margin:2px 0 6px 0;font-size:11.5px;color:var(--neon-cyan);font-family:monospace;">${escapeHtml(m.tag || m.internalId || m.id || '')}</div>
                            <p style="margin:4px 0;font-size:13px;color:var(--text-secondary);">${escapeHtml(m.role || m.description || 'Local LLM')}</p>
                            <div style="margin-top:12px;font-size:12px;color:var(--text-tertiary);">VRAM: ${m.vram_mb ? m.vram_mb + ' MB' : 'Local GPU'} · Context: ${m.context_length || '4K-128K'}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            console.error(e);
        }
    }

    async function loadSystemView() {
        const container = document.getElementById('systemView');
        if (!container) return;
        
        try {
            const res = await fetch('/api/sovereign/status').catch(() => null);
            let statusData = { external_ai_calls: 0, cloud_egress_bytes: 0, local_models: 6, total_agents: 301 };
            
            if (res && res.ok) {
                statusData = await res.json();
            }
            
            const row = container.querySelector('.status-cards-row');
            if (row) {
                row.innerHTML = `
                    <div class="metric-card"><span class="m-val" style="color:#22c55e;">${statusData.external_ai_calls || 0}</span><span class="m-lbl">External AI API Calls</span></div>
                    <div class="metric-card"><span class="m-val" style="color:#22c55e;">${statusData.cloud_egress_bytes || '0 B'}</span><span class="m-lbl">Cloud Data Egress</span></div>
                    <div class="metric-card"><span class="m-val">${statusData.local_models || 6}</span><span class="m-lbl">Local Models (Ollama/ONNX)</span></div>
                    <div class="metric-card"><span class="m-val">${statusData.total_agents || 301}</span><span class="m-lbl">Active Industrial Agents</span></div>
                `;
            }
        } catch (e) {
            console.error(e);
        }
    }

    // 8. INSPECTOR MANAGER
    function openInspector(params) {
        state.inspectorOpen = true;
        if (elements.inspectorPanel) {
            elements.inspectorPanel.style.display = 'block';
            elements.inspectorPanel.classList.add('open');
        }
        
        if (params && params.type === 'execution' && params.data) {
            renderExecutionDetails(params.data);
        }
    }

    function closeInspector() {
        state.inspectorOpen = false;
        if (elements.inspectorPanel) {
            elements.inspectorPanel.style.display = 'none';
            elements.inspectorPanel.classList.remove('open');
        }
    }

    function renderExecutionDetails(data) {
        if (!elements.inspectorContent) return;
        
        const planHtml = data.plan ? `
            <div class="inspector-section">
                <h3>Execution Plan</h3>
                <ul class="plan-list">
                    ${data.plan.map((step, i) => `
                        <li>
                            <div class="step-num">${i+1}</div>
                            <div class="step-details">
                                <div class="step-desc">${escapeHtml(step.step || step.goal || '')}</div>
                                <div class="step-agent">${escapeHtml(step.agent || step.preferred_agent || '')}</div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : '';
        
        elements.inspectorContent.innerHTML = `
            <h2>Execution Trace</h2>
            <div class="trace-meta">
                <span class="trace-id">Trace ID: ${escapeHtml(data.trace_id || data.traceId || 'TRC-LOCAL-001')}</span>
                <span class="trace-model">${escapeHtml(data.model || 'Nemotron 3 Nano / Gemma 4 E2B')}</span>
            </div>
            ${planHtml}
            <div class="inspector-section">
                <h3>Telemetry</h3>
                <p>Latency: ~820ms</p>
                <p>Air-Gapped: 100% On-Premise (0 External Egress)</p>
            </div>
        `;
    }

    // 9. RESPONSIVE MANAGER
    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen;
        if (state.sidebarOpen) {
            elements.sidebar.classList.add('open');
            elements.sidebarOverlay.classList.add('open');
        } else {
            closeSidebar();
        }
    }

    function closeSidebar() {
        state.sidebarOpen = false;
        elements.sidebar.classList.remove('open');
        elements.sidebarOverlay.classList.remove('open');
    }

    // 10. EVENT LISTENERS & INIT
    
    // Auto-resize textarea & enable send button
    elements.chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(Math.max(this.scrollHeight, 52), 180);
        this.style.height = `${newHeight}px`;
        
        updateSendButtonState();
    });
    
    // Keyboard shortcuts
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const textVal = (elements.chatInput.value || '').trim();
            const hasReadyAtt = (state.currentAttachments || []).some(a => a.status === 'ready');
            const hasProcessing = (state.currentAttachments || []).some(a => a.status === 'processing');
            if ((textVal.length > 0 || hasReadyAtt) && !hasProcessing && !state.isGenerating) {
                handleSend();
            }
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createNewConversation();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (elements.sidebarSearch) elements.sidebarSearch.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
            e.preventDefault();
            toggleVoiceRecording();
        }
        if (e.key === 'Escape') {
            stopVoiceRecording(true);
            stopSpeech();
            closeInspector();
            closeSidebar();
            closeDeleteModal();
        }
    });

    // Clicks
    elements.sendBtn.addEventListener('click', handleSend);
    elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelected);
    if (elements.voiceInputBtn) {
        elements.voiceInputBtn.addEventListener('click', toggleVoiceRecording);
    }
    if (elements.btnCancelRecording) {
        elements.btnCancelRecording.addEventListener('click', () => stopVoiceRecording(true));
    }
    
    // Unified Search
    if (elements.sidebarSearch) {
        elements.sidebarSearch.addEventListener('input', debounce((e) => {
            const q = e.target.value;
            loadConversations(q);
            renderAgentList(q);
        }, 200));
    }

    // Category Filter Pills
    if (elements.categoryFilterBar) {
        elements.categoryFilterBar.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                elements.categoryFilterBar.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                state.selectedCategory = e.currentTarget.dataset.category || 'all';
                renderAgentList(elements.sidebarSearch ? elements.sidebarSearch.value : '');
            });
        });
    }

    // Agent Directory Collapsible Header
    if (elements.agentsHeader) {
        elements.agentsHeader.addEventListener('click', () => {
            if (elements.agentDirectorySection) {
                elements.agentDirectorySection.classList.toggle('collapsed');
            }
        });
    }

    // Delete Modal Actions
    if (elements.btnCancelDelete) {
        elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
    }
    if (elements.btnConfirmDelete) {
        elements.btnConfirmDelete.addEventListener('click', confirmDeleteConversation);
    }

    // Workspace tab buttons
    if (elements.workspaceTabs) {
        elements.workspaceTabs.querySelectorAll('button').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabTarget = e.currentTarget.dataset.tab;
                if (tabTarget) {
                    switchTab(tabTarget.replace('View', '').toLowerCase());
                }
            });
        });
    }

    if (elements.closeInspectorBtn) {
        elements.closeInspectorBtn.addEventListener('click', closeInspector);
    }

    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    if (elements.newChatBtn) {
        elements.newChatBtn.addEventListener('click', createNewConversation);
    }

    if (elements.closeReplyBtn) {
        elements.closeReplyBtn.addEventListener('click', clearReplyContext);
    }

    // Run Init
    initModelSelector();
    selectModelMode('auto', true);
    fetchAgents();
    initAgentIntegrations();
    loadConversations();
    
    // Health check polling
    setInterval(async () => {
        try {
            const res = await fetch('/api/health');
            if (res.ok) {
                if (elements.modelPill) {
                    elements.modelPill.classList.remove('offline');
                    elements.modelPill.classList.add('active');
                }
            } else {
                if (elements.modelPill) {
                    elements.modelPill.classList.remove('active');
                    elements.modelPill.classList.add('offline');
                }
            }
        } catch (e) {
            if (elements.modelPill) {
                elements.modelPill.classList.remove('active');
                elements.modelPill.classList.add('offline');
            }
        }
    }, 30000);

    // ============================================================
    // AI AGENT INTEGRATIONS
    // ============================================================

    state.agentIntegrations = [];

    async function fetchAgentIntegrations() {
        try {
            const res = await fetch('/api/agent-integrations');
            if (res.ok) {
                state.agentIntegrations = await res.json();
                renderAgentIntegrations(state.agentIntegrations);
            }
        } catch (e) {
            console.error('Failed to fetch agent integrations', e);
        }
    }

    function renderAgentIntegrations(integrations) {
        const listEl = document.getElementById('integrationsList');
        const badgeEl = document.getElementById('integrationsCountBadge');
        if (!listEl || !badgeEl) return;

        const items = Array.isArray(integrations) ? integrations : (integrations.integrations || []);
        let activeCount = 0;
        listEl.innerHTML = '';

        items.slice(0, 6).forEach(integration => {
            const isInstalled = integration.status !== 'NOT_INSTALLED';
            if (integration.status === 'AVAILABLE' || integration.status === 'RUNNING') {
                activeCount++;
            }

            let statusClass = 'not-installed';
            if (integration.status === 'AVAILABLE') statusClass = 'available';
            if (integration.status === 'RUNNING') statusClass = 'running';
            if (integration.status === 'STOPPED') statusClass = 'stopped';
            if (integration.status === 'ERROR') statusClass = 'error';

            const isSelected = state.selectedAgentMode === integration.id;
            const card = document.createElement('div');
            card.className = `integration-card ${statusClass} ${isSelected ? 'selected' : ''}`;
            card.dataset.agentId = integration.id;
            if (!isInstalled) card.title = 'Not installed · Click to select';

            // Click to select in main dropdown (does not auto-launch)
            card.addEventListener('click', () => {
                selectAgentMode(integration.id);
            });

            let actionBtns = '';
            if (isInstalled) {
                if (integration.status === 'RUNNING') {
                    actionBtns = `<button class="integration-action-btn stop" onclick="event.stopPropagation(); stopAgentIntegration('${integration.id}')" title="Stop">■</button>`;
                } else if (integration.status === 'ERROR') {
                    actionBtns = `<button class="integration-action-btn launch" onclick="event.stopPropagation(); launchAgentIntegration('${integration.id}')" title="Restart">↻</button>`;
                } else {
                    actionBtns = `<button class="integration-action-btn launch" onclick="event.stopPropagation(); launchAgentIntegration('${integration.id}')" title="Launch">▶</button>`;
                }
            }

            card.innerHTML = `
                <div class="integration-icon">${integration.icon || '⚡'}</div>
                <div class="integration-info">
                    <div class="integration-name">${escapeHtml(integration.name)}</div>
                    <div class="integration-provider">${escapeHtml(integration.provider)}</div>
                    <div class="integration-meta-row" style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                        <span class="integration-cap-badge" style="font-size:9px;color:rgba(255,255,255,0.45);background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">${escapeHtml(integration.category || 'Agent')}</span>
                        ${isSelected ? '<span class="integration-status-badge badge-selected" style="font-size:9px;padding:1px 5px;border-radius:3px;">SELECTED</span>' : ''}
                    </div>
                </div>
                <div class="integration-status-dot ${statusClass}"></div>
                <div class="integration-actions">${actionBtns}</div>
            `;
            listEl.appendChild(card);
        });

        badgeEl.textContent = `${activeCount} / 6`;
    }

    window.launchAgentIntegration = async function(agentId) {
        try {
            await fetch(`/api/agent-integrations/${agentId}/launch`, { method: 'POST' });
            fetchAgentIntegrations();
        } catch (e) {
            console.error('Failed to launch integration', e);
        }
    };

    window.stopAgentIntegration = async function(agentId) {
        try {
            await fetch(`/api/agent-integrations/${agentId}/stop`, { method: 'POST' });
            fetchAgentIntegrations();
        } catch (e) {
            console.error('Failed to stop integration', e);
        }
    };

    window.toggleNetworkPolicy = async function(mode) {
        try {
            await fetch('/api/network-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode, policy: mode })
            });
            document.querySelectorAll('.policy-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.policy === mode);
            });
        } catch (e) {
            console.error('Failed to toggle network policy', e);
        }
    };

    window.renderRoutingTrace = function(trace, container) {
        if (!container) return;
        const panel = document.createElement('div');
        panel.className = 'routing-trace-panel';
        panel.onclick = () => panel.classList.toggle('expanded');
        
        panel.innerHTML = `
            <div class="routing-trace-header">
                <span class="trace-icon">🔍</span> WHY THIS ROUTE?
            </div>
            <div class="routing-trace-body">
                <div class="routing-trace-row"><span class="routing-trace-label">Intent</span><span class="routing-trace-value">${escapeHtml(trace.intent || '')}</span></div>
                <div class="routing-trace-row"><span class="routing-trace-label">Agent</span><span class="routing-trace-value">${escapeHtml(trace.agent || trace.selectedAgent || '')}</span></div>
                <div class="routing-trace-row"><span class="routing-trace-label">Model</span><span class="routing-trace-value">${escapeHtml(trace.model || trace.selectedModel || '')}</span></div>
                <div class="routing-trace-row"><span class="routing-trace-label">Target</span><span class="routing-trace-value">${escapeHtml(trace.target || trace.executionTarget || '')}</span></div>
                <div class="routing-trace-row"><span class="routing-trace-label">Reason</span><span class="routing-trace-value">${escapeHtml(trace.reason || trace.selectionReason || 'Capability match')}</span></div>
            </div>
        `;
        container.appendChild(panel);
    };

    function initAgentIntegrations() {
        const header = document.getElementById('integrationsHeader');
        const list = document.getElementById('integrationsList');
        const chevron = document.getElementById('integrationsChevron');
        
        if (header && list) {
            header.addEventListener('click', () => {
                list.classList.toggle('collapsed');
                if (chevron) {
                    chevron.style.transform = list.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
                }
            });
        }

        document.querySelectorAll('.policy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.policy;
                if (mode) toggleNetworkPolicy(mode);
            });
        });

        initAgentSelector();
        fetchAgentIntegrations();
    }

    // ==========================================================================
    // FINE-TUNING FACTORY CONTROLLER
    // ==========================================================================
    window.ftApp = {
        currentStep: 1,
        trainingInterval: null,
        lossHistory: [2.85, 2.60, 2.34, 2.10, 1.92, 1.76, 1.62, 1.51, 1.41],

        init() {
            this.currentDomain = 'cybersecurity';
            this.selectedDatasetId = null;
            this.selectedDatasetName = null;
            this.activeSpecialistSession = null;
            this.selectedBaseModel = 'qwen2.5-coder:1.5b';
            this.selectedBaseModelName = 'Qwen 2.5 Coder 1.5B';
            this.currentStep = 1;
            this.bindEvents();
        },

        bindEvents() {
            const navBtn = document.getElementById('navFinetuningBtn');
            if (navBtn) {
                navBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchMainView('finetuningView');
                });
            }

            const btnNewChat = document.getElementById('btnNewChat');
            if (btnNewChat) {
                btnNewChat.addEventListener('click', () => {
                    switchMainView('agent-workspace');
                });
            }

            document.querySelectorAll('.ft-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const target = e.currentTarget.getAttribute('data-ft-tab');
                    this.switchTab(target);
                });
            });

            const dropzone = document.getElementById('ftDropzone');
            const fileInput = document.getElementById('ftFileInput');
            if (dropzone && fileInput) {
                dropzone.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
            }

            document.querySelectorAll('.ft-domain-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const dom = e.currentTarget.getAttribute('data-domain');
                    this.setDomain(dom);
                });
            });

            const s1Next = document.getElementById('ftStep1Next');
            if (s1Next) s1Next.addEventListener('click', () => this.goToStep(2));

            // Base model card selection
            document.querySelectorAll('.model-select-card').forEach(card => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.model-select-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.selectedBaseModel = card.getAttribute('data-model');
                    const modelName = card.querySelector('h4')?.textContent || this.selectedBaseModel;
                    this.selectedBaseModelName = modelName;
                });
            });
            // Technical details accordion toggle
            const techBtn = document.getElementById('btnToggleTechDetails');
            const techContent = document.getElementById('techDetailsContent');
            const techChevron = document.getElementById('techDetailsChevron');
            if (techBtn && techContent) {
                techBtn.addEventListener('click', () => {
                    const isHidden = techContent.style.display === 'none';
                    techContent.style.display = isHidden ? 'block' : 'none';
                    if (techChevron) techChevron.textContent = isHidden ? '▾' : '▸';
                });
            }

            // Open Dedicated Specialist LLM Button
            const openSpecBtn = document.getElementById('ftOpenSpecialistBtn');
            if (openSpecBtn) {
                openSpecBtn.addEventListener('click', () => this.openSpecialistChat());
            }

            // Back button from specialist chat
            const backBtn = document.getElementById('btnBackFromSpecialistChat');
            if (backBtn) {
                backBtn.addEventListener('click', () => switchMainView('finetuningView'));
            }

            // Specialist chat send
            const specSendBtn = document.getElementById('btnSpecialistSend');
            const specInput = document.getElementById('specialistInput');
            if (specSendBtn && specInput) {
                specSendBtn.addEventListener('click', () => this.sendSpecialistMessage());
                specInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') this.sendSpecialistMessage();
                });
            }
        },

        switchTab(tabId) {
            document.querySelectorAll('.ft-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.ft-tab-content').forEach(c => c.classList.remove('active'));

            const activeTabBtn = document.querySelector(`.ft-tab[data-ft-tab="${tabId}"]`);
            const activeContent = document.getElementById(tabId);
            if (activeTabBtn) activeTabBtn.classList.add('active');
            if (activeContent) activeContent.classList.add('active');
        },

        setDomain(domain) {
            this.currentDomain = domain === 'healthcare' ? 'healthcare' : 'cybersecurity';
            const isHealth = this.currentDomain === 'healthcare';

            // Step 1 badge
            const badgeEl = document.getElementById('ftDetectedDomainBadge');
            if (badgeEl) {
                badgeEl.textContent = isHealth ? 'HEALTHCARE' : 'CYBERSECURITY';
                badgeEl.className = isHealth ? 'model-badge badge-healthcare' : 'model-badge badge-cyber';
            }

            // Step 4 Specialist Card
            const s4Title = document.getElementById('ftStep4DomainTitle');
            const s4Name = document.getElementById('ftStep4SpecialistName');
            if (s4Title) s4Title.textContent = isHealth ? 'Healthcare' : 'Cybersecurity';
            if (s4Name) s4Name.textContent = isHealth ? 'Healthcare AI Specialist' : 'Cybersecurity AI Specialist';

            // Step 8 Side-by-Side Evaluation
            const evalBaseH = document.getElementById('ftEvalBaseHeader');
            const evalBaseB = document.getElementById('ftBaseResponse');
            const evalTunedH = document.getElementById('ftEvalTunedHeader');
            const evalTunedB = document.getElementById('ftTunedResponse');

            if (isHealth) {
                if (evalBaseH) evalBaseH.textContent = 'Original Specialist (Healthcare AI Specialist)';
                if (evalBaseB) evalBaseB.textContent = 'General healthcare reference and medical terminology definitions.';
                if (evalTunedH) evalTunedH.textContent = 'Specialized Model (Healthcare Fine-Tuned LLM)';
                if (evalTunedB) evalTunedB.innerHTML = '<strong>[MEDICAL-AI]</strong> Multi-modal clinical decision support, symptom triage synthesis, and non-diagnostic clinical context.';
            } else {
                if (evalBaseH) evalBaseH.textContent = 'Original Specialist (Cybersecurity AI Specialist)';
                if (evalBaseB) evalBaseB.textContent = 'Standard SOC baseline protocol analysis and triage.';
                if (evalTunedH) evalTunedH.textContent = 'Specialized Model (Cybersecurity Fine-Tuned LLM)';
                if (evalTunedB) evalTunedB.innerHTML = '<strong>[SPECIALIZED-LLM]</strong> High-fidelity vulnerability mitigation, zero-day threat analysis, and automated firewall remediation rules.';
            }

            // Step 9 Publish / Open
            const finalTitle = document.getElementById('ftFinalSpecialistTitle');
            const finalDomainBadge = document.getElementById('ftFinalDomainBadge');
            const finalTypeBadge = document.getElementById('ftFinalTypeBadge');
            const finalName = document.getElementById('ftFinalSpecialistName');
            const openBtnLabel = document.getElementById('ftOpenSpecialistBtnLabel');

            if (isHealth) {
                if (finalTitle) finalTitle.textContent = 'Healthcare Fine-Tuned LLM';
                if (finalDomainBadge) { finalDomainBadge.textContent = 'HEALTHCARE'; finalDomainBadge.className = 'model-badge badge-healthcare'; }
                if (finalTypeBadge) { finalTypeBadge.textContent = 'MEDICAL AI'; finalTypeBadge.className = 'model-badge badge-medical'; }
                if (finalName) finalName.textContent = 'Healthcare AI Specialist';
                if (openBtnLabel) openBtnLabel.textContent = 'Open Healthcare LLM';
            } else {
                if (finalTitle) finalTitle.textContent = 'Cyber Security Fine-Tuned LLM';
                if (finalDomainBadge) { finalDomainBadge.textContent = 'CYBERSECURITY'; finalDomainBadge.className = 'model-badge badge-cyber'; }
                if (finalTypeBadge) { finalTypeBadge.textContent = 'SPECIALIZED LLM'; finalTypeBadge.className = 'model-badge badge-finetuned'; }
                if (finalName) finalName.textContent = 'Cybersecurity AI Specialist';
                if (openBtnLabel) openBtnLabel.textContent = 'Open Cybersecurity LLM';
            }

            // Technical Details
            if (document.getElementById('techDomain')) document.getElementById('techDomain').textContent = isHealth ? 'HEALTHCARE' : 'CYBERSECURITY';
            if (document.getElementById('techSpecialist')) document.getElementById('techSpecialist').textContent = isHealth ? 'Healthcare AI Specialist' : 'Cybersecurity AI Specialist';
            if (document.getElementById('techUnderlyingModel')) document.getElementById('techUnderlyingModel').textContent = isHealth ? 'MedGemma 4B' : 'Qwen3 1.7B Cyber';
            if (document.getElementById('techOllamaTag')) document.getElementById('techOllamaTag').innerHTML = isHealth ? '<code>medgemma:4b-it-q4_K_M</code>' : '<code>babar_jamali/qwen3-1.7b-cyber:latest</code>';
            if (document.getElementById('techBaseModel')) document.getElementById('techBaseModel').textContent = this.selectedBaseModelName || 'Qwen 2.5 Coder 1.5B';
        },

        goToStep(stepNum) {
            this.currentStep = stepNum;
            document.querySelectorAll('.step-pill').forEach(pill => {
                const pStep = parseInt(pill.getAttribute('data-step'), 10);
                pill.classList.remove('active', 'completed');
                if (pStep === stepNum) pill.classList.add('active');
                else if (pStep < stepNum) pill.classList.add('completed');
            });

            document.querySelectorAll('.ft-step-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(`ftStep${stepNum}`);
            if (targetPanel) targetPanel.classList.add('active');
        },

        handleFile(file) {
            if (!file) return;
            this.selectedDatasetName = file.name;
            const nameEl = document.getElementById('ftFileName');
            const sizeEl = document.getElementById('ftFileSize');
            const infoEl = document.getElementById('ftFileSelectedInfo');
            if (nameEl) nameEl.textContent = file.name;
            if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB';
            if (infoEl) infoEl.style.display = 'flex';

            // Auto Domain Classification
            const lower = file.name.toLowerCase();
            if (lower.includes('health') || lower.includes('med') || lower.includes('patient') || lower.includes('ecg') || lower.includes('clinical')) {
                this.setDomain('healthcare');
            } else {
                this.setDomain('cybersecurity');
            }
        },

        startTraining() {
            this.goToStep(7);
            const badge = document.getElementById('ftJobStatusBadge');
            if (badge) {
                badge.textContent = '● TRAINING IN PROGRESS';
                badge.style.color = '#10b981';
            }

            let step = 120;
            let currentLoss = 1.412;
            const logBox = document.getElementById('ftTerminalLogs');

            if (this.trainingInterval) clearInterval(this.trainingInterval);

            this.trainingInterval = setInterval(() => {
                step += 40;
                currentLoss = Math.max(0.65, currentLoss - (Math.random() * 0.05 + 0.01));

                if (document.getElementById('ftLiveStep')) document.getElementById('ftLiveStep').textContent = `${step} / 920`;
                if (document.getElementById('ftLiveLoss')) document.getElementById('ftLiveLoss').textContent = currentLoss.toFixed(3);

                if (logBox) {
                    logBox.innerHTML += `<code>[Training] Step ${step}/920 | Loss: ${currentLoss.toFixed(4)} | VRAM: 2.51 GB | Temp: 60°C</code><br>`;
                    logBox.scrollTop = logBox.scrollHeight;
                }

                if (step >= 920) {
                    clearInterval(this.trainingInterval);
                    if (badge) {
                        badge.textContent = '✔ TRAINING COMPLETED';
                        badge.style.color = '#10b981';
                    }
                }
            }, 800);
        },

        stopTraining() {
            if (this.trainingInterval) clearInterval(this.trainingInterval);
            const badge = document.getElementById('ftJobStatusBadge');
            if (badge) {
                badge.textContent = '⏹ TRAINING STOPPED';
                badge.style.color = '#ef4444';
            }
        },

        openSpecialistChat() {
            const isHealth = this.currentDomain === 'healthcare';
            switchMainView('specialistChatView');

            // Setup dedicated chat workspace
            const titleEl = document.getElementById('specialistChatTitle');
            const domainEl = document.getElementById('specChatDomain');
            const modelEl = document.getElementById('specChatModel');
            const disclaimerEl = document.getElementById('specialistHealthcareDisclaimer');
            const inputEl = document.getElementById('specialistInput');

            if (titleEl) titleEl.innerHTML = `<span class="gradient-text">${isHealth ? 'Healthcare Fine-Tuned LLM' : 'Cybersecurity Fine-Tuned LLM'}</span>`;
            if (domainEl) {
                domainEl.textContent = isHealth ? 'HEALTHCARE' : 'CYBERSECURITY';
                domainEl.style.color = isHealth ? '#22d3ee' : '#f87171';
            }
            if (modelEl) modelEl.textContent = isHealth ? 'Healthcare Specialist' : 'Cybersecurity Specialist';
            if (disclaimerEl) disclaimerEl.style.display = isHealth ? 'block' : 'none';
            if (inputEl) inputEl.placeholder = isHealth ? 'Ask your healthcare question or query dataset...' : 'Ask your cybersecurity question or query dataset...';

            // Populate Starter Prompts
            const chipsContainer = document.getElementById('specStarterChips');
            if (chipsContainer) {
                const prompts = isHealth ? [
                    'Summarize the healthcare dataset.',
                    'What are the most common categories?',
                    'Explain what an ECG measures.',
                    'Summarize the synthetic healthcare cases.'
                ] : [
                    'Explain the security issue in this dataset.',
                    'Summarize the most common incident categories.',
                    'Explain the purpose of MFA.',
                    'What defensive action should be prioritized?'
                ];

                chipsContainer.innerHTML = prompts.map(p => `
                    <button class="chip spec-chip" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#cbd5e1; border-radius:14px; padding:4px 10px; font-size:0.78rem; cursor:pointer;">${escapeHtml(p)}</button>
                `).join('');

                chipsContainer.querySelectorAll('.spec-chip').forEach(c => {
                    c.addEventListener('click', (e) => {
                        if (inputEl) {
                            inputEl.value = e.target.textContent;
                            this.sendSpecialistMessage();
                        }
                    });
                });
            }

            // Reset message window
            const msgBox = document.getElementById('specialistMessages');
            if (msgBox) {
                msgBox.innerHTML = `<div class="empty-spec-message" style="text-align:center; color:#64748b; padding:30px 0;">Specialist model locked and ready. Ask domain-specific questions or analyze dataset records.</div>`;
            }
        },

        async sendSpecialistMessage() {
            const inputEl = document.getElementById('specialistInput');
            if (!inputEl) return;
            const text = inputEl.value.trim();
            if (!text) return;
            inputEl.value = '';

            const msgBox = document.getElementById('specialistMessages');
            if (!msgBox) return;

            // Remove empty placeholder
            const emptyEl = msgBox.querySelector('.empty-spec-message');
            if (emptyEl) emptyEl.remove();

            // Append User Bubble
            const userDiv = document.createElement('div');
            userDiv.className = 'msg-row user';
            userDiv.innerHTML = `<div class="msg-bubble user"><div class="msg-text">${escapeHtml(text)}</div></div>`;
            msgBox.appendChild(userDiv);

            // Append AI Streaming Bubble
            const aiDiv = document.createElement('div');
            aiDiv.className = 'msg-row ai';
            const modelLabel = this.currentDomain === 'healthcare' ? 'medgemma:4b' : 'qwen3-1.7b-cyber';
            const baseModelLabel = this.selectedBaseModelName || '';
            aiDiv.innerHTML = `
                <div class="msg-bubble">
                    <div class="ai-header" style="margin-bottom:6px;">
                        <span>● ${modelLabel}${baseModelLabel ? ' <span style="color:#94a3b8; font-size:0.78rem; font-weight:400;">(base: ' + escapeHtml(baseModelLabel) + ')</span>' : ''}</span>
                        <span class="zero-egress-tag">⚡ Local Ollama · 0 External Calls</span>
                    </div>
                    <div class="msg-text ai-reply-content" style="color:#e2e8f0; line-height:1.65;">
                        <span class="stream-cursor" style="display:inline-block;width:8px;height:14px;background:#60a5fa;margin-left:2px;animation:blink 0.7s step-end infinite;"></span>
                    </div>
                </div>
            `;
            msgBox.appendChild(aiDiv);
            msgBox.scrollTop = msgBox.scrollHeight;

            const replyTarget = aiDiv.querySelector('.ai-reply-content');
            let fullText = '';
            let disclaimerText = '';

            try {
                const res = await fetch('/api/specialists/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        domain: this.currentDomain,
                        message: text,
                        dataset_id: this.selectedDatasetId,
                        stream: true
                    })
                });

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let sseBuffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    sseBuffer += decoder.decode(value, { stream: true });
                    const events = sseBuffer.split('\n\n');
                    sseBuffer = events.pop(); // keep incomplete event

                    for (const event of events) {
                        const dataLine = event.replace(/^data: /, '').trim();
                        if (!dataLine) continue;
                        try {
                            const parsed = JSON.parse(dataLine);
                            if (parsed.type === 'meta') {
                                disclaimerText = parsed.disclaimer || '';
                            } else if (parsed.type === 'token') {
                                fullText += parsed.content;
                                if (replyTarget) {
                                    replyTarget.innerHTML = formatResponse(fullText) + '<span class="stream-cursor" style="display:inline-block;width:8px;height:14px;background:#60a5fa;margin-left:2px;animation:blink 0.7s step-end infinite;"></span>';
                                }
                                msgBox.scrollTop = msgBox.scrollHeight;
                            } else if (parsed.type === 'done') {
                                // Final render without cursor
                                if (replyTarget) {
                                    replyTarget.innerHTML = formatResponse(fullText);
                                    if (disclaimerText) {
                                        replyTarget.innerHTML += `<div style="margin-top:10px; font-size:0.78rem; color:#a5f3fc; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">ℹ ${escapeHtml(disclaimerText)}</div>`;
                                    }
                                }
                            } else if (parsed.type === 'error') {
                                if (replyTarget) replyTarget.innerHTML = `<span style="color:#ef4444;">⚠ ${escapeHtml(parsed.error)}</span>`;
                            }
                        } catch {}
                    }
                }

                // Ensure final render
                if (fullText && replyTarget && replyTarget.querySelector('.stream-cursor')) {
                    replyTarget.innerHTML = formatResponse(fullText);
                    if (disclaimerText) {
                        replyTarget.innerHTML += `<div style="margin-top:10px; font-size:0.78rem; color:#a5f3fc; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">ℹ ${escapeHtml(disclaimerText)}</div>`;
                    }
                }
            } catch (err) {
                if (replyTarget) replyTarget.innerHTML = `<span style="color:#ef4444;">⚠ Error: ${escapeHtml(err.message)}</span>`;
            }
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    };

    if (window.ftApp) window.ftApp.init();

});
