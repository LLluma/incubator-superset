import React from 'react';
import { shallow } from 'enzyme';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';

import { List } from 'react-virtualized';

import SliceAdder from '../../../../src/dashboard/components/SliceAdder';
import { sliceEntitiesForDashboard as mockSliceEntities } from '../fixtures/mockSliceEntities';

describe('SliceAdder', () => {
  const mockEvent = {
    key: 'Enter',
    target: {
      value: 'mock event target',
    },
    preventDefault: () => {},
  };
  const props = {
    ...mockSliceEntities,
    fetchAllSlices: () => {},
    selectedSliceIds: [127, 128],
    userId: '1',
    height: 100,
  };
  const errorProps = {
    ...props,
    errorMessage: 'this is error',
  };

  describe('SliceAdder.sortByComparator', () => {
    it('should sort by timestamp descending', () => {
      const sortedTimestamps = Object.values(props.slices)
        .sort(SliceAdder.sortByComparator('changed_on'))
        .map(slice => slice.changed_on);
      expect(
        sortedTimestamps.every((currentTimestamp, index) => {
          if (index === 0) {
            return true;
          }
          return currentTimestamp < sortedTimestamps[index - 1];
        }),
      ).to.equal(true);
    });

    it('should sort by slice_name', () => {
      const sortedNames = Object.values(props.slices)
        .sort(SliceAdder.sortByComparator('slice_name'))
        .map(slice => slice.slice_name);
      const expectedNames = Object.values(props.slices)
        .map(slice => slice.slice_name)
        .sort();
      expect(sortedNames).to.deep.equal(expectedNames);
    });
  });

  it('render List', () => {
    const wrapper = shallow(<SliceAdder {...props} />);
    wrapper.setState({ filteredSlices: Object.values(props.slices) });
    expect(wrapper.find(List)).to.have.length(1);
  });

  it('render error', () => {
    const wrapper = shallow(<SliceAdder {...errorProps} />);
    wrapper.setState({ filteredSlices: Object.values(props.slices) });
    expect(wrapper.text()).to.have.string(errorProps.errorMessage);
  });

  it('componentDidMount', () => {
    sinon.spy(SliceAdder.prototype, 'componentDidMount');
    sinon.spy(props, 'fetchAllSlices');

    shallow(<SliceAdder {...props} />, {
      lifecycleExperimental: true,
    });
    expect(SliceAdder.prototype.componentDidMount.calledOnce).to.equal(true);
    expect(props.fetchAllSlices.calledOnce).to.equal(true);

    SliceAdder.prototype.componentDidMount.restore();
    props.fetchAllSlices.restore();
  });

  describe('componentWillReceiveProps', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = shallow(<SliceAdder {...props} />);
      wrapper.setState({ filteredSlices: Object.values(props.slices) });
      sinon.spy(wrapper.instance(), 'setState');
    });
    afterEach(() => {
      wrapper.instance().setState.restore();
    });

    it('fetch slices should update state', () => {
      wrapper.instance().componentWillReceiveProps({
        ...props,
        lastUpdated: new Date().getTime(),
      });
      expect(wrapper.instance().setState.calledOnce).to.equal(true);

      const stateKeys = Object.keys(
        wrapper.instance().setState.lastCall.args[0],
      );
      expect(stateKeys).to.include('filteredSlices');
    });

    it('select slices should update state', () => {
      wrapper.instance().componentWillReceiveProps({
        ...props,
        selectedSliceIds: [127],
      });
      expect(wrapper.instance().setState.calledOnce).to.equal(true);

      const stateKeys = Object.keys(
        wrapper.instance().setState.lastCall.args[0],
      );
      expect(stateKeys).to.include('selectedSliceIdsSet');
    });
  });

  describe('should rerun filter and sort', () => {
    let wrapper;
    let spy;
    beforeEach(() => {
      wrapper = shallow(<SliceAdder {...props} />);
      wrapper.setState({ filteredSlices: Object.values(props.slices) });
      spy = sinon.spy(wrapper.instance(), 'getFilteredSortedSlices');
    });
    afterEach(() => {
      spy.restore();
    });

    it('searchUpdated', () => {
      const newSearchTerm = 'new search term';
      wrapper.instance().searchUpdated(newSearchTerm);
      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[0]).to.equal(newSearchTerm);
    });

    it('handleSelect', () => {
      const newSortBy = 1;
      wrapper.instance().handleSelect(newSortBy);
      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[1]).to.equal(newSortBy);
    });

    it('handleKeyPress', () => {
      wrapper.instance().handleKeyPress(mockEvent);
      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[0]).to.equal(mockEvent.target.value);
    });
  });
});
