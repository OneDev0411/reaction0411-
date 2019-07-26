import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { PaginationButtons } from "../sortableTableComponents";


class SortableTablePagination extends Component {
  constructor(props) {
    super(props);

    this.getSafePage = this.getSafePage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.applyPage = this.applyPage.bind(this);

    this.state = {
      page: props.page
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ page: nextProps.page });
  }

  getSafePage(safePage) {
    let page = safePage;
    if (isNaN(page)) {
      ({ page } = this.props);
    }
    return Math.min(Math.max(page, 0), this.props.pages - 1);
  }

  changePage(page) {
    let safePage = page;
    safePage = this.getSafePage(page);
    this.setState({ page: safePage });
    if (this.props.page !== safePage) {
      this.props.onPageChange(safePage);
    }
  }

  handlePageSizeChange = (event) => {
    const { onPageSizeChange } = this.props;
    onPageSizeChange && onPageSizeChange(Number(event.target.value));
  }

  applyPage(event) {
    event && event.preventDefault();
    const { page } = this.state;
    this.changePage(page === "" ? this.props.page : page);
  }

  render() {
    const {
      // Computed
      pages,
      // Props
      page,
      showPageSizeOptions,
      pageSizeOptions,
      pageSize,
      showPageJump,
      canPrevious,
      canNext,
      className,
      PreviousComponent = PaginationButtons,
      NextComponent = PaginationButtons
    } = this.props;

    return (
      <div
        className={classnames(className, "-pagination")}
        style={this.props.paginationStyle}
      >
        <div className="-center">
          <span className="-pageInfo">
            {this.props.pageText}{" "}
            {showPageJump
              ? <div className="-pageJump">
                <input
                  type={this.state.page === "" ? "text" : "number"}
                  onChange={(event) => {
                    const val = event.target.value;
                    const currentPage = val - 1;
                    if (val === "") {
                      return this.setState({ page: val });
                    }
                    return this.setState({ page: this.getSafePage(currentPage) });
                  }}
                  value={this.state.page === "" ? "" : this.state.page + 1}
                  onBlur={this.applyPage}
                  onKeyPress={(event) => {
                    if (event.which === 13 || event.keyCode === 13) {
                      this.applyPage();
                    }
                  }}
                />
              </div>
              : <span className="-currentPage">{page + 1}</span>}{" "}
            {this.props.ofText}{" "}
            <span className="-totalPages">{pages || 1}</span>
          </span>
          {showPageSizeOptions &&
            <span className="select-wrap -pageSizeOptions">
              <select
                onBlur={this.handlePageSizeChange}
                onChange={this.handlePageSizeChange}
                value={pageSize}
              >
                {pageSizeOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option} {this.props.rowsText}
                  </option>
                ))}
              </select>
            </span>}
        </div>
        <div className="-previous">
          <PreviousComponent
            onClick={(event) => { // eslint-disable-line no-unused-vars
              if (canPrevious) {
                return this.changePage(page - 1);
              }
              return null;
            }}
            disabled={!canPrevious}
          >
            {this.props.previousText}
          </PreviousComponent>
        </div>
        <span className="-divider">|</span>
        <div className="-next">
          <NextComponent
            onClick={(event) => { // eslint-disable-line no-unused-vars
              if (canNext) {
                return this.changePage(page + 1);
              }
              return null;
            }}
            disabled={!canNext}
          >
            {this.props.nextText}
          </NextComponent>
        </div>
      </div>
    );
  }
}

SortableTablePagination.propTypes = {
  NextComponent: PropTypes.func,
  PreviousComponent: PropTypes.func,
  canNext: PropTypes.bool,
  canPrevious: PropTypes.bool,
  className: PropTypes.string,
  nextText: PropTypes.string,
  ofText: PropTypes.string,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  pageSizeOptions: PropTypes.array,
  pageText: PropTypes.string,
  pages: PropTypes.number,
  paginationStyle: PropTypes.object,
  previousText: PropTypes.string,
  rowsText: PropTypes.string,
  showPageJump: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
  showPageSizeOptions: PropTypes.bool // eslint-disable-line react/boolean-prop-naming
};

export default SortableTablePagination;
