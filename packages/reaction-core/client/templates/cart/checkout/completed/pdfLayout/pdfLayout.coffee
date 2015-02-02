###
# Template for orders pdf layout, uses jsPDF with
# very limited html support.
#   jsPDF docs state: "HTML Element, or anything supported by html2canvas"
#   see: http://mrrio.github.io/jsPDF/examples/basic.html
###

Template.completedPDFLayout.inheritsHelpersFrom "completedOrderLayout"
Template.completedPDFLayout.inheritsEventsFrom "completedOrderLayout"
Template.completedPDFLayout.helpers
  invoice: () ->
    return @.payment.invoices[0]
