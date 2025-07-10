<div class="migaku-card migaku-card-front">
    <div class="migaku-card-content">
        {{^Is Audio Card}}
            {{^Is Vocabulary Card}}
                <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Sentence}}</div>
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{^Is Audio Card}}
            {{#Is Vocabulary Card}}
                <div class="field" data-popup="yes" data-gender-coloring="yes" data-field-type="target-word">{{editable:Target Word}}</div>
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{#Is Audio Card}}
            {{^Is Vocabulary Card}}
                {{editable:Sentence Audio}}
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{#Is Audio Card}}
            {{#Is Vocabulary Card}}
                {{editable:Word Audio}}
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
    </div>
</div>

<!--###MIGAKU GERMAN SUPPORT JS STARTS###--><script>

    (function () {

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
            console.log('=== FRONT SIDE TARGET WORD DETECTION ===')

            // First try to get from target word field (vocabulary cards)
            const targetWordField = document.querySelector('[data-field-type="target-word"]')
            console.log('Target word field found:', !!targetWordField)
            if (targetWordField) {
                const text = targetWordField.textContent || targetWordField.innerText || ''
                const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                console.log('Target word field content:', cleanText)
                if (cleanText) return cleanText
            }

            // For front side, we need to detect card type and handle differently
            const cardTypeForm = document.querySelector('.migaku-typeselect form')
            if (cardTypeForm) {
                const cardType = cardTypeForm.elements["type"].value
                console.log('Card type:', cardType)

                // For vocabulary cards, the target word is shown in the main content
                if (cardType === 'v' || cardType === 'av') {
                    const mainField = document.querySelector('.migaku-card-content .field')
                    console.log('Main field found:', !!mainField)
                    if (mainField) {
                        const text = mainField.textContent || mainField.innerText || ''
                        const cleanText = text.replace(/\[(.*?)\]/g, '').trim()
                        console.log('Main field content:', cleanText)
                        if (cleanText && cleanText.length > 0) {
                            return cleanText
                        }
                    }
                }

                // For sentence cards on front side, we can't determine the target word
                // since it's not shown. We'll need to highlight nothing or use a different approach
                if (cardType === 's' || cardType === 'as') {
                    console.log('Sentence card - no target word available on front side')
                    // Return null - can't determine target word on sentence card front
                    return null
                }
            }

            console.log('No target word found')
            return null
        }

        function markTargetWordsInSentence() {
            const targetWordText = getTargetWordText()
            console.log('=== MARK TARGET WORDS DEBUG ===')
            console.log('Target word text:', targetWordText)
            if (!targetWordText) {
                console.log('No target word found, skipping highlighting')
                return
            }

            // For front side, get all fields including target word field
            const allFields = document.querySelectorAll('.field')
            console.log('Found fields:', allFields.length)

            let totalMatches = 0
            allFields.forEach((field, fieldIndex) => {
                const words = field.querySelectorAll('.word')
                console.log(`Field ${fieldIndex}: Found ${words.length} words`)

                words.forEach((word, wordIndex) => {
                    const wordText = word.querySelector('.word-text')
                    if (wordText) {
                        // More flexible matching - check if target word is contained in the word
                        const wordContent = wordText.textContent.toLowerCase().trim()
                        const targetContent = targetWordText.toLowerCase().trim()

                        console.log(`  Word ${wordIndex}: "${wordContent}" vs target "${targetContent}"`)

                        // Split target word by spaces to handle multi-word targets
                        const targetWords = targetContent.split(/\s+/)

                        // Check for exact match or partial match
                        let isMatch = false
                        let matchType = ''

                        // Exact match
                        if (wordContent === targetContent) {
                            isMatch = true
                            matchType = 'exact'
                        }

                        // Check each word in target phrase
                        if (!isMatch) {
                            targetWords.forEach(targetWord => {
                                if (targetWord.length > 2) {
                                    if (wordContent === targetWord) {
                                        isMatch = true
                                        matchType = 'word-exact'
                                    } else if (wordContent.includes(targetWord) && targetWord.length > 2) {
                                        isMatch = true
                                        matchType = 'word-contains'
                                    } else if (targetWord.includes(wordContent) && wordContent.length > 2) {
                                        isMatch = true
                                        matchType = 'word-contained'
                                    }
                                }
                            })
                        }

                        // For German, also check without case endings
                        if (!isMatch && targetContent.length > 3) {
                            // Remove common German endings for better matching
                            const germanWordStem = wordContent.replace(/(en|er|es|e|n|s)$/, '')
                            const targetStem = targetContent.replace(/(en|er|es|e|n|s)$/, '')

                            if (germanWordStem.length > 2 && targetStem.length > 2) {
                                if (germanWordStem === targetStem) {
                                    isMatch = true
                                    matchType = 'german-stem-exact'
                                } else if (germanWordStem.includes(targetStem) && targetStem.length > 2) {
                                    isMatch = true
                                    matchType = 'german-stem-contains'
                                } else if (targetStem.includes(germanWordStem) && germanWordStem.length > 2) {
                                    isMatch = true
                                    matchType = 'german-stem-contained'
                                }
                            }
                        }

                        if (isMatch) {
                            console.log(`    ✓ MATCH! Type: ${matchType}, Adding target-word-highlight class`)
                            wordText.classList.add('target-word-highlight')

                            // Debug: Check if class was actually added
                            const hasClass = wordText.classList.contains('target-word-highlight')
                            console.log(`    Class added successfully: ${hasClass}`)

                            // Debug: Check computed styles
                            const computedStyle = window.getComputedStyle(wordText)
                            console.log(`    Computed font-style: ${computedStyle.fontStyle}`)

                            // JavaScript fallback: Set italic style directly
                            wordText.style.fontStyle = 'italic'
                            wordText.style.fontWeight = 'normal'
                            console.log(`    Fallback: Applied italic style directly`)

                            totalMatches++
                        } else {
                            console.log(`    ✗ No match for "${wordContent}"`)
                        }
                    }
                })
            })

            console.log(`=== TOTAL MATCHES: ${totalMatches} ===`)
        }

        function debugHtmlStructure() {
            console.log('=== HTML STRUCTURE DEBUG ===')

            // Check for migaku-card-front class
            const cardFront = document.querySelector('.migaku-card-front')
            console.log('Has .migaku-card-front:', !!cardFront)

            // Check all fields
            const allFields = document.querySelectorAll('.field')
            console.log('Total fields found:', allFields.length)

            allFields.forEach((field, index) => {
                console.log(`Field ${index}:`)
                console.log('  - innerHTML preview:', field.innerHTML.substring(0, 100) + '...')
                console.log('  - has .word elements:', field.querySelectorAll('.word').length)

                const words = field.querySelectorAll('.word')
                words.forEach((word, wordIndex) => {
                    const wordText = word.querySelector('.word-text')
                    if (wordText) {
                        console.log(`    Word ${wordIndex}: "${wordText.textContent}" - classes: ${wordText.className}`)
                    }
                })
            })

            // Check for any existing target-word-highlight elements
            const highlighted = document.querySelectorAll('.target-word-highlight')
            console.log('Elements with target-word-highlight class:', highlighted.length)
            highlighted.forEach((el, index) => {
                console.log(`  ${index}: "${el.textContent}" - style: ${el.style.cssText}`)
            })
        }

        const fields = document.querySelectorAll('.field')

        for (field of fields) {
            handleField(field)
        }

        // Mark target words after all fields are processed
        markTargetWordsInSentence()

        // Debug HTML structure
        debugHtmlStructure()

        // Debug: Check if we're on a vocabulary card and show target word
        const cardTypeForm = document.querySelector('.migaku-typeselect form')
        if (cardTypeForm) {
            const cardType = cardTypeForm.elements["type"].value
            console.log('DEBUG: Card type is:', cardType)

            if (cardType === 'v' || cardType === 'av') {
                const targetField = document.querySelector('[data-field-type="target-word"]')
                if (targetField) {
                    console.log('DEBUG: Target word field content:', targetField.textContent)
                }
            }
        }



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
