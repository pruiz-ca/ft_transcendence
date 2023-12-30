const plugin = require('tailwindcss/plugin')

module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      boxShadow: {
        '3xl': '8px 8px 8px #080808, -8px -8px 8px #202020',
      },
      screens: {
        'sh': { 'raw': '(min-height: 350px)' },
      },
      colors: {
        glaucous: '#7068d9', //#3763d4 //#637Fdb //#7068d9
        steelBlue: '#189CB4',
        codGray: '#212534', //#121212
        mineShaft: '#191c29', //#282828
        cards: '#424242',
      },
      keyframes: {
      },
      animation: {
      },
      fontFamily: {
        inter: ['Inter', 'sans serif'],
        ceracy: ['CeraCY-Regular'],
        monospace: ['monospace'],
		// galiver: ['Galiver', 'sans regular']
      },
    },
  },
  variants: {
    width: ['responsive', 'hover', 'focus'],
  },
  plugins: [],
}
