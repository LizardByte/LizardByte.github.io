---
layout: post
title: Blog Guide
gh-repo: LizardByte/LizardByte.github.io
gh-badge: [follow, star]
tags: []
comments: false

simple-tabs-example:
  - name: 'Tab A'
    content: 'Content of tab A'
  - name: 'Tab B'
    content: 'Content of tab B'

indexed-tabs-example:
  - name: 'cURL'
    content:
      - |
        ```bash
        curl -L https://example.com
        ```
      - |
        ```bash
        curl -L https://google.com
        ```
  - name: 'Python'
    content:
      - |
        ```python
        import requests
        response = requests.get('https://example.com')
        print(response.text)
        ```
      - |
        ```python
        import requests
        response = requests.get('https://google.com')
        print(response.text)
        ```
---

## Admonitions

### Usage
You can use admonitions with the following syntax:

```markdown
{% raw %}
{% include admonition.html type="important" body="This is information intended to draw attention." %}
{% endraw %}
```

Optionally, a custom title can be added:

```markdown
{% raw %}
{% include admonition.html type="hint" title="Custom Title" body="This is information intended to draw attention." %}
{% endraw %}
```

### Types
Valid types of admonitions are:

- `attention`
- `caution`
- `danger`
- `error`
- `hint`
- `important`
- `note`
- `seealso`
- `tip`
- `todo`
- `warning`

### Examples

{% include admonition.html type="attention" body="This is information intended to draw attention." %}
{% include admonition.html type="caution" body="This is information intended to draw attention." %}
{% include admonition.html type="danger" body="This is information intended to draw attention." %}
{% include admonition.html type="error" body="This is information intended to draw attention." %}
{% include admonition.html type="hint" body="This is information intended to draw attention." %}
{% include admonition.html type="important" body="This is information intended to draw attention." %}
{% include admonition.html type="note" body="This is information intended to draw attention." %}
{% include admonition.html type="seealso" body="This is information intended to draw attention." %}
{% include admonition.html type="tip" body="This is information intended to draw attention." %}
{% include admonition.html type="todo" body="This is information intended to draw attention." %}
{% include admonition.html type="warning" body="This is information intended to draw attention." %}

## Simple-Tabs

### Usage
You can use simple tabs with the following syntax:

```markdown
{% raw %}
{% include tabs.html tabs=page.simple-tabs-example %}
{% endraw %}
```

The tabs object must have a `name` and `content` field. The `content` field should be a string when using simple tabs.

### Example

{% include tabs.html tabs=page.simple-tabs-example %}

## Indexed-Tabs

### Usage
You can use indexed tabs with the following syntax:

```markdown
{% raw %}
{% include tabs.html tabs=page.indexed-tabs-examples index=0 %}
{% endraw %}
```

The tabs object must have a `name` and `content` field.
The `content` field should be an array of strings when using indexed tabs.

### Examples

#### Index 0
{% include tabs.html tabs=page.indexed-tabs-example index=0 %}

#### Index 1
{% include tabs.html tabs=page.indexed-tabs-example index=1 %}
