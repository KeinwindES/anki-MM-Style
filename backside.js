<div class="migaku-card migaku-card-back">

    <div class="migaku-card-screenshot">
        {{editable:Screenshot}}
    </div>

    <div class="migaku-card-content">
        <div class="migaku-card-sentence-audio">
            {{editable:Sentence Audio}}
        </div>
        <div class="migaku-card-sentence">
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-type-styling="yes">{{editable:Sentence}}</div>
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-type-styling="yes">{{editable:Target Word}}</div>
        </div>
        <div class="migaku-card-translation">
            {{editable:Translation}}
        </div>
        {{#Sentence}}
            <hr class="sentence-separator">
        {{/Sentence}}
        <div class="migaku-card-unknown-audio migaku-indented">
            {{editable:Word Audio}}
        </div>
        <div class="migaku-card-unknown migaku-indented">
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-type-styling="yes">{{editable:Target Word}}</div>
        </div>

        <div class="migaku-card-examples migaku-indented">
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-type-styling="yes">{{editable:Example Sentences}}</div>
        </div>
        <div class="migaku-card-definitions migaku-indented">
            <div class="field" data-popup="yes" data-type-styling="yes">{{editable:Definitions}}</div>
        </div>
        <div class="migaku-card-images">
            {{editable:Images}}
        </div>
    </div>
</div>


<div class="migaku-typeselect">
    <form>
        <label>
            <input type="radio" id="type-s" name="type" value="s">
            Sentence
        </label>

        <label>
            <input type="radio" id="type-v" name="type" value="v">
            Vocabulary
        </label>

        <label>
            <input type="radio" id="type-as" name="type" value="as">
            Audio Sentence
        </label>

        <label>
            <input type="radio" id="type-av" name="type" value="av">
            Audio Vocabulary
        </label>
    </form>
</div>

<script>
    (function() {
        'use strict';

        if (typeof pycmd !== "undefined") {
            const form = document.querySelector('.migaku-typeselect form');

            if (form) {
                // Determine current card type
                let card_type = `{{Is Vocabulary Card}}`.replace(/(<([^>]+)>)/ig, '').length ? 'v' : 's';
                if (`{{Is Audio Card}}`.replace(/(<([^>]+)>)/ig, '').length) {
                    card_type = 'a' + card_type;
                }

                // Set initial radio button value
                if (form.elements["type"]) {
                    form.elements["type"].value = card_type;
                }

                // Handle form changes
                form.addEventListener('change', function() {
                    const selected_type = form.elements['type'].value;
                    if (selected_type) {
                        pycmd('update_card_type|' + selected_type);
                    }
                });
            }
        } else {
            // Hide type selector on mobile/preview
            const typeSelect = document.querySelector('.migaku-typeselect');
            if (typeSelect) {
                typeSelect.style.display = 'none';
            }
        }
    })();
</script>

<!--###MIGAKU GERMAN SUPPORT JS STARTS###-->
<script>
    (function() {
        'use strict';

        const word_pos_names = {
            v: "Verb",
            adj: "Adjective",
            adv: "Adverb",
            art: "Article",
            cnum: "Cardinal Number",
            circ: "Zirkumposition",
            conj: "Conjunction",
            demo: "Demonstrative",
            ind: "Indefinite Pronoun",
            int: "Interjection",
            onum: "Ordinal Number",
            n: "Noun",
            pn: "Proper Noun",
            poss: "Possessive",
            ppos: "Postposition",
            per: "Personal Pronoun",
            prep: "Preposition",
            prepart: "Preposition w/ Article",
            proadv: "Pronominal Adverb",
            part: "Particle",
            rel: "Relative Pronoun",
            trunc: "Kompositions-Erstglied",
            vpart: "Verb Particle",
            advpro: "Adverbial Interrogative Pronoun",
            pro: "Interrogative Pronoun",
            zu: "Zu for Infinitive"
        };

        /**
         * Parse text for German syntax annotations
         * @param {string} text - Text to parse
         * @returns {Array} Array of syntax elements
         */
        function parseSyntax(text) {
            const ret = [];
            const syntax_re = new RegExp(/(([a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]+?)\[(.*?)\])/gm);
            let last_idx = 0;
            let match;

            do {
                match = syntax_re.exec(text);

                if (match) {
                    if (match.index > last_idx) {
                        ret.push({
                            type: 'plain',
                            text: text.substring(last_idx, match.index)
                        });
                    }

                    const args = match[3].split(',');
                    const dict_form = args[0] || '';
                    const word_pos = args[1] || '';
                    const gender = args[2] || 'x';

                    ret.push({
                        type: 'syntax',
                        text: match[2],
                        dict_form: dict_form,
                        word_pos: word_pos,
                        gender: gender
                    });

                    last_idx = match.index + match[0].length;
                }
            } while (match);

            if (last_idx < text.length) {
                ret.push({
                    type: 'plain',
                    text: text.substr(last_idx)
                });
            }

            return ret;
        }

        /**
         * Convert syntax element to DOM node
         * @param {Object} syntax_element - Parsed syntax element
         * @param {Object} field_settings - Field configuration
         * @returns {Node} DOM node
         */
        function syntaxElementToNode(syntax_element, field_settings) {
            if (syntax_element.type !== 'syntax') {
                return document.createTextNode(syntax_element.text);
            } else {
                const word_container = document.createElement('span');
                word_container.classList.add('word');

                const audio_play_word = syntax_element.text;
                word_container.addEventListener('click', function() {
                    if (typeof pycmd !== 'undefined') {
                        pycmd('play_audio-' + audio_play_word);
                    }
                });

                const text_elem = document.createElement('span');
                text_elem.textContent = syntax_element.text;
                text_elem.classList.add('word-text');

                if (field_settings.gender_coloring !== 'no' && syntax_element.gender) {
                    let gender_class = 'gender-';
                    if (field_settings.gender_coloring === 'hover') {
                        gender_class += 'hover-';
                    }
                    gender_class += syntax_element.gender;
                    text_elem.classList.add(gender_class);
                }

                // Add type-based styling
                if (field_settings.type_styling !== 'no' && syntax_element.word_pos) {
                    text_elem.classList.add('type-' + syntax_element.word_pos);
                }
                word_container.appendChild(text_elem);

                if (field_settings.popup === 'yes') {
                    const popup_hover_box = document.createElement('div');
                    popup_hover_box.classList.add('popup-hover-box');
                    word_container.appendChild(popup_hover_box);

                    const popup_container = document.createElement('div');
                    popup_container.classList.add('popup');
                    word_container.appendChild(popup_container);

                    const pos_gender = document.createElement('div');
                    pos_gender.classList.add('word-pos-gender');
                    popup_container.appendChild(pos_gender);

                    const pos = document.createElement('div');
                    pos.classList.add('word-pos');
                    pos.textContent = word_pos_names[syntax_element.word_pos] || '';
                    pos_gender.appendChild(pos);

                    const gender_symbol = document.createElement('div');
                    gender_symbol.classList.add('word-gender-symbol-' + syntax_element.gender);
                    pos_gender.appendChild(gender_symbol);

                    const dict_form = document.createElement('div');
                    dict_form.classList.add('dict-form');
                    dict_form.textContent = syntax_element.dict_form;
                    popup_container.appendChild(dict_form);
                }

                return word_container;
            }
        }

        /**
         * Convert syntax array to DOM nodes
         */
        function syntaxToNodes(syntax, field_settings) {
            return syntax.map(function(syntax_element) {
                return syntaxElementToNode(syntax_element, field_settings);
            });
        }

        /**
         * Recursively process text nodes in a field
         */
        function handleFieldTextNodes(node, field_settings) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const syntax = parseSyntax(text);
                const nodes = syntaxToNodes(syntax, field_settings);
                for (const child of nodes) {
                    node.parentNode.insertBefore(child, node);
                }
                node.parentNode.removeChild(node);
            } else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    handleFieldTextNodes(node.childNodes[i], field_settings);
                }
            }
        }

        /**
         * Process a field element and add target word class if needed
         */
        function handleField(field) {
            const field_settings = {
                popup: field.getAttribute('data-popup') || 'no',
                gender_coloring: field.getAttribute('data-gender-coloring') || 'no',
                type_styling: field.getAttribute('data-type-styling') || 'no'
            };

            handleFieldTextNodes(field, field_settings);

            // Add target-word class if this is a Target Word field
            const fieldContainer = field.closest('.migaku-card-unknown') ||
                                   field.parentElement.classList.contains('migaku-card-unknown');
            if (fieldContainer) {
                field.classList.add('target-word');
            }
        }

        // Process all fields
        const fields = document.querySelectorAll('.field');
        for (const field of fields) {
            handleField(field);
        }

        /**
         * Close all active popups
         */
        function closeAllActive() {
            const current_popups = document.querySelectorAll('.active');
            for (const popup of current_popups) {
                popup.classList.remove('active', 'popup-active');
            }
        }

        /**
         * Enable popup for an element with positioning
         */
        function activeEnablePopup(elem) {
            const popup_elem = elem.querySelector('.popup');
            if (!popup_elem) {
                return;
            }

            elem.classList.add('popup-active');

            const rect = popup_elem.getBoundingClientRect();
            const viewHeight = window.innerHeight || document.documentElement.clientHeight;
            const viewWidth = window.innerWidth || document.documentElement.clientWidth;

            function isTooHigh() {
                return rect.top < 0;
            }

            function isTooLow() {
                return rect.bottom >= viewHeight;
            }

            function isTooRight() {
                return rect.right >= viewWidth;
            }

            function isTooLeft() {
                return rect.left < 0;
            }

            elem.classList.remove('popup-direction-u', 'popup-direction-d', 'popup-direction-l', 'popup-direction-r');

            // Try upward direction first
            elem.classList.add('popup-direction-u');
            if (!isTooHigh()) {
                return;
            }
            elem.classList.remove('popup-direction-u');

            // Try downward direction
            elem.classList.add('popup-direction-d');
            if (!isTooLow()) {
                return;
            }
            elem.classList.remove('popup-direction-d');

            // Try leftward direction
            elem.classList.add('popup-direction-l');
            if (!isTooLeft()) {
                return;
            }
            elem.classList.remove('popup-direction-l');

            // Try rightward direction
            elem.classList.add('popup-direction-r');
            if (!isTooRight()) {
                return;
            }
            elem.classList.remove('popup-direction-r');

            // Default to upward if nothing fits
            elem.classList.add('popup-direction-u');
        }

        /**
         * Handle mouse enter event
         */
        function on_activeEnter() {
            const was_active = this.classList.contains('active');
            closeAllActive();
            if (was_active) {
                return;
            }
            this.classList.add('active');
            activeEnablePopup(this);
        }

        /**
         * Handle mouse leave event
         */
        function on_activeLeave() {
            this.classList.remove('active', 'popup-active');
        }

        /**
         * Handle click toggle event for mobile
         */
        function on_activeToggle() {
            if (this.classList.contains('active')) {
                this.classList.remove('active', 'popup-active');
            } else {
                closeAllActive();
                this.classList.add('active');
                activeEnablePopup(this);
            }
        }

        // Set up event listeners for word elements
        const word_elements = document.querySelectorAll('.word');
        const is_mobile = typeof pycmd === 'undefined';

        for (const elem of word_elements) {
            if (is_mobile) {
                elem.addEventListener('click', on_activeToggle);
                elem.classList.add('tappable');
            } else {
                elem.addEventListener('mouseenter', on_activeEnter);
                elem.addEventListener('mouseleave', on_activeLeave);
            }
        }
    })();
</script>
<!--###MIGAKU GERMAN SUPPORT JS ENDS###-->
