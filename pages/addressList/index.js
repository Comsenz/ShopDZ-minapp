// pages/addressList/index.js
const app = getApp()
// const curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    address_list:[],
    id:'',
    state:null,
    address_id:null,
    is_addressDel:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  defaultFun:function(data){
    // app.http('v1/user/defaultCity', {
    //   id: data.currentTarget.dataset.item._id
    // }, 'POST')
    //   .then(res => {
    //     app.globalData.userInfo.address = res.data
    //     this.setData({
    //       id: res.data._id
    //     })
    //     if (this.data.state == 1){
    //       wx.navigateBack({
    //         delta: 1
    //       })
    //     }
    //   })
  },
  onLoad: function (options) {
    var self = this;
    self.address();
    // this.setData({
    //   id: app.globalData.userInfo.address._id,
    //   state: options ? options.type:null
    // })
  },
  address:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/Member/addressList',
      data:{key:key},
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        if(res.data.code == 0){
          var address = res.data.data.address_list;
          self.setData({
            address_list:address,
          });
          // console.log(address);
        }
      }
    })
  },
  addressDel:function(e){
    var self = this;
    var key = wx.getStorageSync('key');
    var address_id = e.currentTarget.dataset.id;
    var data = {
      key:key,
      address_id:address_id,
    }
    wx.showModal({
      title: '确定要删除此地址吗？',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        } else {
          wx.request({
            url: curl + 'api.php/Member/addressDel',
            data: data,
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            method: 'POST',
            success: function (res) {
              if (res.data.code == 1) {
                wx.showToast({
                  title: "默认地址不能删除",
                  icon: 'none',
                  duration: 2000
                })
              }
              self.address();
              self.setData({
                address_id: null,
                is_addressDel: false,
              });
            }
          })
        }
      }
    })
  },
  deletes:function(e){
    var self = this;
    var address_id = e.currentTarget.dataset.id;
    self.setData({
      address_id: address_id,
      is_addressDel:true,
    });
  },
  cancel:function(){
    var self = this;
    self.setData({
      address_id: null,
      is_addressDel: false,
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var self = this;
    self.address();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})