import 'babel-polyfill';

import chai, {assert} from 'chai';
import chaiEnzyme from 'chai-enzyme';
import React from 'react';
import {mount} from 'enzyme';
import {asyncReactor} from '../lib';
import {renderToStaticMarkup} from 'react-dom/server';

chai.use(chaiEnzyme());

describe('Async reactor', () => {

  describe('Error handling', () => {

    it('should throw if no component', () => {
      const fn = () => asyncReactor(null);

      assert.throws(fn, /You must provide an async component, null given/);
    });

    it('should throw if React element is passed', () => {
      const Foo = async function() {
        return <div></div>;
      };

      const fn = () => asyncReactor(<Foo />);

      assert.throws(
        fn,
        'Incompatible React element given, please change asyncReactor(<Foo />) to asyncReactor(Foo).'
      );
    });

    it.skip('should throw if component is not async', () => {
      const Component = asyncReactor(function Component() {});
      const fn = () => mount(<Component />);

      assert.throws(fn, /you must provide an async component/);
    });

    it.skip('should catch an error in async component', () => {
      const Component = asyncReactor(async function Component() {
        throw new Error('foo');
      });

      mount(<Component />);
    });
  });

  describe('Render', () => {

    it('should render an async component', (done) => {
      const Component = asyncReactor(async function Component() {
        return <h1>foo</h1>;
      });

      const wrapper = mount(<Component />);

      setTimeout(() => {
        assert.equal(wrapper.text(), 'foo');
        done();
      }, 10);
    });

    it('should render an async component in a tree', (done) => {
      // eslint-disable-next-line
      function Wrapper({children}) {
        return <div>{children}</div>;
      }

      const Component = asyncReactor(async function Component() {
        return <h1>foo</h1>;
      });

      const wrapper = mount(
        <Wrapper>
          <Component />
        </Wrapper>
      );

      setTimeout(() => {
        assert.equal(wrapper.text(), 'foo');
        done();
      }, 10);
    });

    describe('childs', () => {

      it('should pass props to async component', (done) => {
        function Child() {
          return <a>a</a>;
        }

        const Component = asyncReactor(async function Component({children}) {
          return <b>{children}b</b>;
        });

        const wrapper = mount(
          <Component>
            <Child />
          </Component>
        );

        setTimeout(() => {
          assert.equal(wrapper.text(), 'ab');
          done();
        }, 10);
      });
    });

    describe('props', () => {

      it('should pass props to async component', (done) => {

        const Component = asyncReactor(async function Component({a}) {
          return <h1>{a}</h1>;
        });

        const wrapper = mount(<Component a={'bar'}/>);

        setTimeout(() => {
          assert.equal(wrapper.text(), 'bar');
          done();
        }, 10);
      });

      it('should pass multiple props to async component', (done) => {
        const Component = asyncReactor(async function Component({a, b, c}) {
          return <h1>{a}{b}{c}</h1>;
        });

        const wrapper = mount(<Component a={0} b={1} c={2}/>);

        setTimeout(() => {
          assert.equal(wrapper.text(), '012');
          done();
        }, 10);
      });
    });

    describe('loader', () => {

      it('should show loader while waiting', (done) => {

        function Loader() {
          return <h1>loader</h1>;
        }

        const Component = async function() {
          return <h1>component</h1>;
        };

        const App = asyncReactor(Component, Loader);

        const wrapper = mount(<App />);

        assert.equal(wrapper.text(), 'loader');

        setTimeout(() => {
          assert.equal(wrapper.text(), 'component');
          done();
        }, 10);
      });
    });

    describe('Server-side', () => {

      it('should render', () => {
        const Component = async function() {
          return <h1>component</h1>;
        };

        const App = asyncReactor(Component);

        assert.equal(
          renderToStaticMarkup(<App />),
          '<div></div>' // default loader
        );
      });

      it('should render the loader component', () => {
        function Loader() {
          return <h1>loader</h1>;
        }

        const Component = async function() {
          return <h1>component</h1>;
        };

        const App = asyncReactor(Component, Loader);

        assert.equal(
          renderToStaticMarkup(<App />),
          '<h1>loader</h1>'
        );
      });
    });

    describe('Promise', () => {

      it('should render a Promise', (done) => {
        const App = asyncReactor(
          Promise.resolve(<h1>test</h1>)
        );

        const wrapper = mount(<App />);

        setTimeout(() => {
          assert.equal(wrapper.text(), 'test');
          done();
        }, 10);
      });

      it('should render a Promise with ES6 module', (done) => {
        const App = asyncReactor(
          Promise.resolve({__esModule: true, default: <h1>test</h1>})
        );

        const wrapper = mount(<App />);

        setTimeout(() => {
          assert.equal(wrapper.text(), 'test');
          done();
        }, 10);
      });

      it('should render a Promise with props', (done) => {
        const App = asyncReactor(
          Promise.resolve(({text}) => <h1>{text}</h1>)
        );

        const wrapper = mount(<App text={'ok'}/>);

        setTimeout(() => {
          assert.equal(wrapper.text(), 'ok');
          done();
        }, 10);
      });
    });

  });
});
