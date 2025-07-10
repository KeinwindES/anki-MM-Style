<div class="migaku-card-screenshot">
        {{editable:Screenshot}}
    </div>

    <div class="migaku-card-content">
        <div class="migaku-card-sentence-audio">
            {{editable:Sentence Audio}}
        </div>
        <div class="migaku-card-sentence">
            <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Sentence}}</div>
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
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-field-type="target-word">{{editable:Target Word}}</div>
        </div>

        <div class="migaku-card-examples migaku-indented">
            <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Example Sentences}}</div>
        </div>
        <div class="migaku-card-definitions migaku-indented">
            <div class="field" data-popup="yes">{{editable:Definitions}}</div>
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
    if (typeof (pycmd) !== "undefined") {
        const form = document.querySelector('.migaku-typeselect form');

        let card_type = `{{Is Vocabulary Card}}`.replace(/(<([^>]+)>)/ig, '').length ? 'v' : 's';
        if (`{{Is Audio Card}}`.replace(/(<([^>]+)>)/ig, '').length) {
            card_type = 'a' + card_type;
        }
        form.elements["type"].value = card_type;

        form.onchange = function () {
            const card_type = form.elements['type'].value;
            pycmd('update_card_type|' + card_type);
        }
    }
    else {
        document.querySelector('.migaku-typeselect').style.display = 'none';
    }
</script>

<!--###MIGAKU GERMAN SUPPORT JS STARTS###--><script>

    (function () {

        // Configuration for target word highlighting
        const HIGHLIGHT_CONFIG = {
            // Back side always uses italic only
            backStyle: 'italic'
        };

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
            poss: "Possesive",
            ppos: "Postposiiton",
            per: "Personal Pronoun",
            prep: "Preposition",
            prepart: "Preposition w/ Article",
            proadv: "Pronominal Adverb",
            part: "Particle ",
            rel: "Relative Pronoun",
            trunc: "Kompositions-Erstglied",
            vpart: "Verb Particle",
            advpro: "Adverbial Interrogative Pronoun",
            pro: "Interrogative Pronoun",
            zu: "Zu for Infinitive"
        }


        function parseSyntax(text) {
            let ret = []

            const syntax_re = new RegExp(/(([a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]+?)\[(.*?)\])/gm)
            let last_idx = 0
            let match

            do {
                match = syntax_re.exec(text)

                if (match) {
                    if (match.index > last_idx) {
                        ret.push({
                            type: 'plain',
                            text: text.substring(last_idx, match.index)
                        })
                    }

                    // Handle multiple interpretations separated by |
                    const interpretations = match[3].split('|')
                    const firstInterpretation = interpretations[0]
                    const args = firstInterpretation.split(',')
                    const dict_form = args[0] || ''
                    const word_pos = args[1] || ''
                    const gender = args[2] || 'x'

                    ret.push({
                        type: 'syntax',
                        text: match[2],
                        dict_form: dict_form,
                        word_pos: word_pos,
                        gender: gender
                    })

                    last_idx = match.index + match[0].length
                }
            } while (match)

            // Reset regex state to prevent issues with global regex
            syntax_re.lastIndex = 0

            if (last_idx < text.length) {
                ret.push({
                    type: 'plain',
                    text: text.substring(last_idx)
                })
            }

            return ret
        }

        function syntaxElementToNode(syntax_element, field_settings) {
            if (syntax_element.type !== 'syntax') {
                return document.createTextNode(syntax_element.text)
            }
            else {
                const word_container = document.createElement('span')
                word_container.classList.add('word')

                const audio_play_word = syntax_element.text
                word_container.addEventListener('click', function () {
                    if (typeof pycmd !== 'undefined') {
                        pycmd('play_audio-' + audio_play_word)
                    }
                })

                const text_elem = document.createElement('span')
                text_elem.textContent = syntax_element.text
                text_elem.classList.add('word-text')

                if (field_settings.gender_coloring !== 'no') {
                    let gender_class = 'gender-'
                    if (field_settings.gender_coloring === 'hover') {
                        gender_class += 'hover-'
                    }

                    // Use green for missing/empty gender, otherwise use the actual gender
                    if (syntax_element.gender === 'x' || syntax_element.gender === '' || !syntax_element.gender) {
                        gender_class += 'missing'
                    } else {
                        gender_class += syntax_element.gender
                    }
                    text_elem.classList.add(gender_class)
                }

                // Target word highlighting will be handled after all fields are processed
                // to compare with the actual target word field content


                word_container.appendChild(text_elem)

                if (field_settings.popup === 'yes') {
                    const popup_hover_box = document.createElement('div')
                    popup_hover_box.classList.add('popup-hover-box')
                    word_container.appendChild(popup_hover_box)

                    const popup_container = document.createElement('div')
                    popup_container.classList.add('popup')
                    word_container.appendChild(popup_container)

                    const pos_gender = document.createElement('div')
                    pos_gender.classList.add('word-pos-gender')
                    popup_container.appendChild(pos_gender)

                    const pos = document.createElement('div')
                    pos.classList.add('word-pos')
                    pos.textContent = word_pos_names[syntax_element.word_pos] || ''
                    pos_gender.appendChild(pos)

                    const gender_symbol = document.createElement('div')
                    gender_symbol.classList.add('word-gender-symbol-' + syntax_element.gender);;
                    pos_gender.appendChild(gender_symbol)

                    const dict_form = document.createElement('div')
                    dict_form.classList.add('dict-form')
                    dict_form.textContent = syntax_element.dict_form
                    popup_container.appendChild(dict_form)
                }

                return word_container
            }
        }

        function syntaxToNodes(syntax, field_settings) {
            return syntax.map(function (syntax_element) {
                return syntaxElementToNode(syntax_element, field_settings)
            })
        }


        function handleFieldTextNodes(node, field_settings) {
            if (node.nodeType == Node.TEXT_NODE) {
                const text = node.textContent
                const syntax = parseSyntax(text)
                const nodes = syntaxToNodes(syntax, field_settings)
                for (const child of nodes) {
                    node.parentNode.insertBefore(child, node)
                }
                node.parentNode.removeChild(node)
            }
            else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    handleFieldTextNodes(node.childNodes[i], field_settings)
                }
            }
        }

        function handleField(field) {
            const field_settings = {
                popup: field.getAttribute('data-popup') || 'no',
                gender_coloring: field.getAttribute('data-gender-coloring') || 'no',
                field_element: field
            }

            handleFieldTextNodes(field, field_settings)
        }

        function getTargetWordText() {
            // First try to get from target word field (vocabulary cards)
            const targetWordField = document.querySelector('[data-field-type="target-word"]')
            if (targetWordField) {
                const text = targetWordField.textContent || targetWordField.innerText || ''
                const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                if (cleanText) return cleanText
            }

            // For sentence cards, try to extract from the Target Word field content
            // Look for any element containing target word data
            const targetWordElements = document.querySelectorAll('.migaku-card-unknown .field')
            for (const element of targetWordElements) {
                const text = element.textContent || element.innerText || ''
                const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                if (cleanText && cleanText.length > 0) {
                    return cleanText
                }
            }

            // Try to get from card type detection and extract from available fields
            const cardTypeForm = document.querySelector('.migaku-typeselect form')
            if (cardTypeForm) {
                const cardType = cardTypeForm.elements["type"].value

                // For sentence cards, check if there's a target word in the unknown field
                if (cardType === 's' || cardType === 'as') {
                    // Look for target word in the unknown section
                    const unknownField = document.querySelector('.migaku-card-unknown .field')
                    if (unknownField) {
                        const text = unknownField.textContent || unknownField.innerText || ''
                        const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                        if (cleanText && cleanText.length > 0) {
                            return cleanText
                        }
                    }
                }
            }

            // Alternative approach: check for any bold or emphasized text that might be target word
            const boldElements = document.querySelectorAll('b, strong, em, i')
            for (const element of boldElements) {
                const text = element.textContent || element.innerText || ''
                const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                if (cleanText && cleanText.length > 1 && cleanText.length < 50) {
                    return cleanText
                }
            }

            return null
        }

        function markTargetWordsInSentence() {
            const targetWordText = getTargetWordText()
            if (!targetWordText) return

            // Get all sentence fields but exclude the target word field itself
            const sentenceFields = document.querySelectorAll('.field:not([data-field-type="target-word"])')

            sentenceFields.forEach(field => {
                const words = field.querySelectorAll('.word')
                words.forEach(word => {
                    const wordText = word.querySelector('.word-text')
                    if (wordText) {
                        // More flexible matching - check if target word is contained in the word
                        const wordContent = wordText.textContent.toLowerCase().trim()
                        const targetContent = targetWordText.toLowerCase().trim()

                        // Split target word by spaces to handle multi-word targets
                        const targetWords = targetContent.split(/\s+/)

                        // Check for exact match or partial match
                        let isMatch = false

                        // Exact match
                        if (wordContent === targetContent) {
                            isMatch = true
                        }

                        // Check each word in target phrase
                        targetWords.forEach(targetWord => {
                            if (targetWord.length > 2) {
                                if (wordContent === targetWord ||
                                    (wordContent.includes(targetWord) && targetWord.length > 2) ||
                                    (targetWord.includes(wordContent) && wordContent.length > 2)) {
                                    isMatch = true
                                }
                            }
                        })

                        // For German, also check without case endings
                        if (!isMatch && targetContent.length > 3) {
                            // Remove common German endings for better matching
                            const germanWordStem = wordContent.replace(/(en|er|es|e|n|s)$/, '')
                            const targetStem = targetContent.replace(/(en|er|es|e|n|s)$/, '')

                            if (germanWordStem.length > 2 && targetStem.length > 2) {
                                if (germanWordStem === targetStem ||
                                    (germanWordStem.includes(targetStem) && targetStem.length > 2) ||
                                    (targetStem.includes(germanWordStem) && germanWordStem.length > 2)) {
                                    isMatch = true
                                }
                            }
                        }

                        if (isMatch) {
                            // Back side always uses italic only
                            wordText.classList.add('target-word-highlight')
                        }
                    }
                })
            })
        }




        const fields = document.querySelectorAll('.field')

        for (field of fields) {
            handleField(field)
        }

        // Mark target words after all fields are processed
        markTargetWordsInSentence()

        // Debug function to help identify target word detection issues (can be removed in production)
        function debugTargetWordDetection() {
            console.log('=== DEBUG TARGET WORD DETECTION ===');

            // Check card type
            const cardTypeForm = document.querySelector('.migaku-typeselect form');
            if (cardTypeForm) {
                const cardType = cardTypeForm.elements["type"].value;
                console.log('Card type:', cardType);
            }

            // Check for target word field
            const targetWordField = document.querySelector('[data-field-type="target-word"]');
            console.log('Target word field found:', !!targetWordField);
            if (targetWordField) {
                console.log('Target word field content:', targetWordField.textContent);
            }

            // Check for unknown field
            const unknownField = document.querySelector('.migaku-card-unknown .field');
            console.log('Unknown field found:', !!unknownField);
            if (unknownField) {
                console.log('Unknown field content:', unknownField.textContent);
            }

            // Check all fields
            const allFields = document.querySelectorAll('.field');
            console.log('Total fields found:', allFields.length);
            allFields.forEach((field, index) => {
                console.log(`Field ${index}:`, field.textContent?.substring(0, 100) + '...');
            });

            // Check what getTargetWordText returns
            const detectedTarget = getTargetWordText();
            console.log('Detected target word:', detectedTarget);

            console.log('=== END DEBUG ===');
        }

        // Run debug function (comment out in production)
        // debugTargetWordDetection();

        function closeAllActive() {
            const current_popups = document.querySelectorAll('.active')
            for (const popup of current_popups) {
                popup.classList.remove('active', 'popup-active')
            }
        }

        function activeEnablePopup(elem) {
            const popup_elem = elem.querySelector('.popup')
            if (!popup_elem) {
                return
            }

            elem.classList.add('popup-active')

            function isTooHigh() {
                return popup_elem.getBoundingClientRect().top < 0
            }

            function isTooLow() {
                return popup_elem.getBoundingClientRect().bottom >= (window.innerHeight || document.documentElement.clientHeight)
            }

            function isTooRight() {
                return popup_elem.getBoundingClientRect().right >= (window.innerWidth || document.documentElement.clientWidth)
            }

            function isTooLeft() {
                return popup_elem.getBoundingClientRect().left < 0
            }

            elem.classList.remove('popup-direction-u', 'popup-direction-d', 'popup-direction-l', 'popup-direction-r')

            elem.classList.add('popup-direction-u')
            if (!isTooHigh()) {
                return
            }
            elem.classList.remove('popup-direction-u')

            elem.classList.add('popup-direction-d')
            if (!isTooLow()) {
                return
            }
            elem.classList.remove('popup-direction-d')

            elem.classList.add('popup-direction-l')
            if (!isTooLeft()) {
                return
            }
            elem.classList.remove('popup-direction-l')

            elem.classList.add('popup-direction-r')
            if (!isTooRight()) {
                return
            }
            elem.classList.remove('popup-direction-r')

            elem.classList.add('popup-direction-u')
        }

        function on_activeEnter() {
            const was_active = this.classList.contains('active')
            closeAllActive()
            if (was_active) {
                return
            }
            this.classList.add('active')
            activeEnablePopup(this)
        }

        function on_activeLeave() {
            this.classList.remove('active', 'popup-active')
        }

        function on_activeToggle() {
            if (this.classList.contains('active')) {
                this.classList.remove('active', 'popup-active')
            } else {
                closeAllActive()
                this.classList.add('active')
                activeEnablePopup(this)
            }
        }

        const word_elements = document.querySelectorAll('.word')
        const is_mobile = typeof (pycmd) === typeof (undefined)
        for (elem of word_elements) {
            if (is_mobile) {
                elem.addEventListener('click', on_activeToggle)
                elem.classList.add('tappable')
            } else {
                elem.addEventListener('mouseenter', on_activeEnter)
                elem.addEventListener('mouseleave', on_activeLeave)
            }
        }
    }());

    // Add copyright
    (function() {
        const cards = document.querySelectorAll('.migaku-card');
        cards.forEach(function(card) {
            const copyright = document.createElement('div');
            copyright.className = 'migaku-copyright';
            copyright.textContent = '© Meltastic';
            card.appendChild(copyright);
        });
    })();
</script>
<!--###MIGAKU GERMAN SUPPORT JS ENDS###-->
